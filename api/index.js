const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors())
const PORT = process.env.PORT || 3000;

const filePath = '../view/data.json';

app.use(bodyParser.json());

app.get('/list', (req, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        res.json(JSON.parse(data));
    });
});

app.post('/add', (req, res) => {
    console.log(req.body)
    const { lat, lng, date } = req.body;

    if (!lat || !lng || !date) {
        res.status(400).json({ error: 'Missing fields' });
        return;
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
        console.log('File Created');
    } 

    fs.readFile(filePath, 'utf8', async (err, data) => {

        let points = []

        points = JSON.parse(data)

        const maxId = points.reduce((max, point) => {
            return point.id > max ? point.id : max;
        }, 0);

        points.push({
            "id":points.length == 0 ? 0 : maxId+1,
            "lat": lat,
            "lng": lng,
            "date": date
        });


        fs.writeFile(filePath, JSON.stringify(points), err => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(201).json([{"R":"S","MESAJ":"Success"}]);
        });
    });

});

app.delete('/remove',(req,res)=>{

    fs.readFile(filePath, 'utf8', async (err, data) => {

        points = JSON.parse(data)


        const index = points.findIndex(point => point.id === parseInt(req.query['id']));
        console.log(index)

        if(index == -1){
            res.status(404).json([{"R":"F","MESSAGE":"Point not found."}]);
            return
        }

        points.splice(index,1);

        await fs.writeFile(filePath, JSON.stringify(points), err => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('data.json updated.');
        });

        res.status(204).json([{"R":"S","MESSAGE":"Point deleted."}]);
    });



})

app.all('*',(req,res)=>{
    res.status(404).json([{"R":"F","MESSAGE":"Wrong Route"}]);

})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
