const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");

const app = express();

/*To accept in JSON from client*/
app.use(express.json());

/*For providing a secure connection middleware*/
app.use(cors());

/*For connecting database to BackEnd*/
const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'qwerty',
      database : 'webDev'
    }
  }); 

app.get("/",(req,res) => {
    res.json(database.users);
})

app.post("/signin",(req,res) => {
    const {email,password} = req.body;

    //Form validation
    if(!email || !password){
        return res.status(400).json("Unable to Sign In");
    }
    
    db.select("email","hash").from("login")
    .where("email","=",email)
    .then(data =>{
        const isValid = bcrypt.compareSync(password,data[0].hash);
        if(isValid){
            return db.select("*").from("users")
             .where("email","=",email)
             .then(user => {
                 res.json(user[0])
             })
             .catch(err => res.status(400).json("Unable to get user from database"))
        }
        else{
            res.status(400).json("Unable to Sign In")
        }
    }) 
    .catch(err => res.status(400).json("Unable to Sign In"))  
})

app.post("/register",(req,res) => {
    const {name,email,password} = req.body;

    //Form validation
    if(!name || !email || !password){
        return res.status(400).json("Unable to register");
    }

    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into("login")
        .returning("email")
        .then(loginEmail => {
            return trx("users")
            .returning("*")
            .insert({
                name:name,
                email:loginEmail[0],
                joined: new Date()
            }).then(user => {
                res.json(user[0]);  
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json("Unable to register"))
})

app.get("/profile/:id",(req,res) => {
    const {id} = req.params;

    db.select("*").from("users").where({id:id})
    .then(user => {
        if(user.length){
            res.json(user[0]);
        }
        else{
            res.status(400).json("Not found")
        }
    })
    .catch(err => res.status(400).json("Error getting user"))
})

app.put("/image",(req,res) => {
    const {id} = req.body;
    db("users").where("id","=",id)
    .increment("entries",1)
    .returning("entries")
    .then(entries => {
            res.json(entries);
    })
    .catch(err => res.status(400).json("Unable to get entries"))
})

app.listen(process.env.PORT || 3000,() => {
    console.log(`App running at port ${process.env.PORT}`);
})