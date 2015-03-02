var objectId = require('mongodb').ObjectID;

CollectionDriver = function(db){
    this.db = db;
};

CollectionDriver.prototype.getCollection = function(collectionName, callback){
    this.db.collection(collectionName, function(error, the_collection){
        if(error)callback(error);
        else callback(null, the_collection);
    });
};

CollectionDriver.prototype.findAll = function(collectionName, callback){
    this.getCollection(collectionName, function(error, the_collection){
        if(error) callback(error);
        else{
            the_collection.find().toArray(function(error, results){
                if(error)callback(error);
                else{
                    callback(null, results);
                }
            });
        }
    });
};

CollectionDriver.prototype.get = function(collectionName, id, callback){
    this.getCollection(collectionName, function(error, the_collection){
        if(error)callback(error);
        else{
            var checkForHexRegExpression = new RegExp("^[0-9a-fA-F]{24}$");
            if(!checkForHexRegExpression.test(id)){
                callback({error:"invalid_id"});
            }
            else{
                the_collection.findOne({'_id':objectId(id)}, function(error, doc){
                    if(error)callback(error);
                    else callback(null, doc);
                });
            }
        }
    });
};

CollectionDriver.prototype.save = function(collectionName, obj, callback){
    this.getCollection(collectionName, function(error, the_collection){
        if(error)callback(error);
        else {
            obj.created_at = new Date();
            the_collection.insert(obj, function(){
                callback(null, obj);
            });
        }
    });
};

CollectionDriver.prototype.query = function(collectionName, query, callback){
    this.getCollection(collectionName, function(error, the_collection){
        if(error)callback(error);
        else{
            the_collection.find(query).toArray(function(error, results){
                if(error)callback(error);
                else callback(null, results)
            });
        }
    })
};

exports.CollectionDriver = CollectionDriver;