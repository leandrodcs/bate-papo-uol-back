import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';

const server = express();
server.use(cors());
server.use(express.json());

const participants = [
    {
        name: "Maria",
        lastStatus: Date.now()
    }
];
const messages = [];

server.post(`/participants`, (req, res) => {
    const newUser = {
        ...req.body,
        lastStatus: Date.now()
    }
    if(!newUser.name || participants.find((p) => p.name === newUser.name)) {
        res.sendStatus(400);
    }
    else {
        participants.push(newUser);
        messages.push(
            {
                from: req.body.name,
                to: "Todos",
                text: "entra na sala...",
                type: "status",
                time: dayjs().format('hh:mm:ss')
            }
        )
        res.status(200).send(messages);
    }
});

server.get(`/participants`, (req, res) => {
    res.send(participants);
})

server.post(`/messages`, (req, res) => {
    const newMessage = {
        from: req.headers.user,
        ...req.body
    };
    if(!newMessage.to || !newMessage.text || (newMessage.type !== "message" && newMessage.type !== "private_message") || !participants.find(p => p.name === newMessage.from)) {
        res.sendStatus(400);
    }
    else {
        res.sendStatus(200);
    }
});

server.listen(4000);