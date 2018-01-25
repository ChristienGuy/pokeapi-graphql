const fs = require("fs");
const path = require("path");
const ChildProcess = require("child_process");

const exec = ChildProcess.exec;

fs.readdir(path.join(__dirname + "/csv"), (err, files) => {
  files.forEach(file => {
    const fileName = file;
    const collectionName = file.replace(".csv", "");
    const command = `mongoimport -h ${MONGO_DB_URL} -d pokeapi -c ${collectionName} -u ${
      process.env.MONGO_DB_USER
    } -p ${process.env.MONGO_DB_PASS} --file ${path.join(
      __dirname + "/csv/" + fileName
    )} --type csv --headerline`;
    // const command = `mongoimport -h mongodb -d pokeapi -c ${collectionName} --type csv --file ${path.join(__dirname + '/csv/' + fileName)} --headerline`;

    exec(command, (err, stdout, stderr) => {
      console.log(stderr);
    });
  });
});
