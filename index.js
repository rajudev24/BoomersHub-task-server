const express = require('express')
const {MongoClient} = require('mongodb')
const ObjectId = require('mongodb').ObjectId;
const multer  = require('multer');
const path = require('path');


const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qhwuq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const UPLOAD_FOLDER = './upload'

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, UPLOAD_FOLDER);
    },
    filename:(req, file, cb)=>{
        const fileExt = path.extname(file.originalname);
        const fileName = file.originalname.replace(fileExt, "").toLowerCase().split(" ").join("-") + "-" + Date.now();
        cb(null, fileName + fileExt);
    },
})

let upload = multer({
    dest: UPLOAD_FOLDER,
    limits:{
        fileSize: 2000000,

    },
    fileFilter: (req, file, cb) =>{
        if(
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg' 

        ) {
            cb(null, true);
        }else{
            cb(new Error("Only .jpg, .png, or .jpeg format allowed"));
        }
    },
});

async function run(){
    try{
        await client.connect()
        const database = client.db('boomersHub')
        const propertyCollection = database.collection('property');


        app.get('/property', async(req, res)=>{
            const cursor = propertyCollection.find();
            const property = await cursor.toArray();
            res.send(property)
        })

        
        app.get('/property/:search', async(req, res)=>{
            const cursor = await propertyCollection.find({
                "$or":[
                    {"name": {$regex:req.params.search, $options: 'i'}},
                    {"state": {$regex:req.params.search, $options: 'i'}},
                    {"city": {$regex:req.params.search, $options: 'i'}},
                ]
            }).toArray();
            res.send(cursor)
        })


        // This is incomplete becuase I am confused about the data collenction. If I am allow to do that then I can done data collection by POST API. 
        
        app.post('/property', upload.array('images'),  async(req, res)=>{
            const name = req.body.name;
            const address = req.body.address;
            const type = req.body.type;
            const city = req.body.city;
            const capacity = req.body.capacity;
            const zip_Code = req.body.zip_Code;
            // const images = req.files.images
            const long = req.body.long;
            const lat = req.body.lat;
            console.log(name, address, type,capacity, city, zip_Code,  long, lat)
            res.send('success')
        })

        app.use((err, req, res, next)=>{
            if(err){
                if(err instanceof multer.MulterError){
                    res.status(500).send('There was an upload error!')
                } else{
                    res.staus(500).send(err.message);
                }
            }else{
                res.send('success')
            }
        })

    }
    finally{
        // await client.close()
    }
}

run().catch(console.dir)

app.get('/', (req, res)=>{
    res.send('server running')
})

app.listen(port, ()=>{
    console.log(`server running on port`, port)
})