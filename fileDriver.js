var objectId = require('mongodb').ObjectID,
    fs       = require('fs');

FileDriver = function(db){
    this.db = db;
};

FileDriver.prototype.getCollection = function(callback){
    this.db.collection('files', function(err, file_collection){
        if(error)callback(error);
        else callback(null, file_collection);
    });
};

FileDriver.prototype.get = function(id, callback){
    this.getCollection(function(error, file_collection){
        if(error)callback(error);
        else{
            var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
            if(!checkForHexRegExp.test(id)) callback({error:"invalid id"});
            else{
                file_collection.findOne({'_id':objectId(id)}, function(error, doc){
                    if(error)callback(error);
                    else callback(null, doc);
                });
            }
        }
    });
};

FileDriver.prototype.handleGet = function(req, res){
    var fileId = req.params.id;
    if(fileId){
        this.get(fileId, function(error, mFile){
            if(error){res.send(400, error);}
            else{
                if(mFile){
                    var fileName = fileId + mFile.ext,
                        filePath = './uploads/'+fileName;
                    res.sendfile(filePath);
                }else {res.send(400, 'File Not Found');}
            }
        });
    }else{
        res.send(400, 'File Not Found');
    }
};

FileDriver.prototype.save = function(obj, callback){
    this.getCollection(function(error, the_collection){
        if(error)callback(error);
        else{
            obj.created_at = new Date();
            the_collection.insert(obj, function(){
                callback(null, obj);
            });
        }
    })
};

FileDriver.prototype.getNewField = function(nObj,callback){
    this.save(nObj, function(error, obj){
        if(error) callback(error);
        else { callback(null,obj._id);}
    })
};

FileDriver.prototype.handleUploadRequest = function(req, res){
    var ctype = req.get("content-type"),
        ext   = ctype.substr(ctype.indefOf('/')+1);
    if(ext){ext = '.'+ext;}else{ext = '';}
    this.getNewField({'content-type':ctype, 'ext':ext}, function(err, id){
        if(err){res.send(400, err);}
        else{
            var fileName = id + ext,
                filePath = __dirname + '/uploads/' + fileName,
                writable = fs.createWriteStream(filePath);
            req.pipe(writable);
            req.on('end', function(){
                res.send(200, {'_id':id});
            });
            writable.on('error', function(err){
                res.send(500, {error:err});
            });
        }
    });
};

exports.FileDriver = FileDriver;