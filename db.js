const path = require("path");

const getConfig = function getConfig() {
  if (process.argv.length < 3) {
    console.error("Vous devez indiquer le fichier de configuration");
    console.info(`Usage : node ${process.argv[1]} <fileName>`);
    throw new Error("Need config filename");
  } else {
    return require(path.resolve(process.argv[2]));
  }
}

const config = getConfig();
console.log("config", config);

const PORT = config.port;
const Server = require('socket.io');
const io = new Server(PORT, {
  path: '/dbyb',
  serveClient: false,
});

console.log(`Serveur lancé sur le port ${PORT}.`);

const db = Object.create(null);


io.on('connect', (socket) => {
  console.log('Nouvelle connexion');

  socket.on('get', function(field, callback){
    console.log(`get ${field}: ${db[field]}`);
    callback(db[field]);
  });

  socket.on('set', function(field, value, callback){
    if (field in db) {
      console.log(`set error : Field ${field} exists.`);
      callback(false);
    } else {
      console.log(`set ${field} : ${value}`);
      db[field] = value;
      callback(true);
    }

    socket.on('keys', function(db, callback){
      if (db) {
        console.log(`keys : ${Object.keys(db)}`);
        callback(Object.keys(db));
        } else {
          console.log(`keys error : Object ${db} do not exist.`);
          callback([]);
        }
    });

  });

});
