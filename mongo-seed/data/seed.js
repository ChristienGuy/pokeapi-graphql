const fs = require("fs");
const path = require("path");
const ChildProcess = require("child_process");

const exec = ChildProcess.exec;
const command = `mongoimport -h mongodb -d pokeapi -c abilities --type csv --file data/csv/abilities.csv --headerline`;

fs.readdir(path.join(__dirname + "/csv"), (err, files) => {
  
  files.forEach(file => {
    const fileName = file;
    const collectionName = file.replace(".csv", "");

    const command = `mongoimport -h mongodb -d pokeapi -c ${collectionName} --type csv --file ${path.join(__dirname + '/csv/' + fileName)} --headerline`;

    exec(command, (err, stdout, stderr) => {
      console.log(stderr);
    });
  });
});
