var http             = require('http'),
    express          = require('express'),
    path             = require('path'),
    MongoClient      = require('mongodb').MongoClient,
    Server           = require('mongodb').Server,
    CollectionDriver = require('./collectionDriver').CollectionDriver,
    FileDriver       = require('./fileDriver').FileDriver;

var app         = express(),
    mongoHost   = 'localHost',
    mongoPort   = 27017,
    fileDriver,
    collectionDriver,
    mongoClient = new MongoClient(new Server(mongoHost, mongoPort));

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.bodyParser());

mongoClient.open(function(err, mongoClient){
    if(!mongoClient){
        console.error("Error! Exiting... must start MongoDB first");
        process.exit(1);
    }
    var db = mongoClient.db("BuskerDatabase");
    collectionDriver = new CollectionDriver(db);
    fileDriver = new FileDriver(db);
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res){
    res.send('<html><body><h1>Busker</h1></body></html>');
});

app.post('/files', function(req, res){fileDriver.handleUploadRequest(req, res)});
app.get('/files/:id', function(req, res){fileDriver.handleGet(req, res)});

app.get('/:collection', function(req, res, next){
    var params = req.params,
        query  = req.query.query;
    if(query){
        query = JSON.parse(query);
        collectionDriver.query(req.params.collection, query, returnCollectionResult(req, res));
    }else{
        collectionDriver.findAll(req.params.collection, returnCollectionResult(req, res));
    }
});

function returnCollectionResult(req, res){
    return function(error, objs){
        if(error){req.send(400, error);}
        else{
            if(req.accepts('html')){
                res.render('data', {objects:objs, collection: req.params.collection});
            }else{
                res.set('Content-Type', 'application/json');
                res.send(200, objs);
            }
        }
    }
}

app.get('/:collection/:entity', function(req, res){
    var params     = req.params,
        entity     = params.entity,
        collection = params.collection;
    if(entity){
        collectionDriver.get(collection, entity, function(error, objs){
            if(error){res.send(400, error);}
            else{res.send(200, objs);}
        });
    } else{
        res.send(400, {error:'bad url', url: req.url});
    }
});

app.post('/:collection', function(req, res){
    var object     = req.body,
        collection = req.params.collection;
    collectionDriver.save(collection, object, function(err, docs){
        if(err){res.send(400, err);}
        else {res.send(201, docs);}
    });
});

app.use(function(req, res){
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listen on port ' + app.get('port'));
});