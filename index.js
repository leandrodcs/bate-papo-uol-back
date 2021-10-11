import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import { stripHtml } from "string-strip-html";

const server = express();
server.use(cors());
server.use(express.json());

let participants = [
    {
        name: "Leandro",
        lastStatus: Date.now()
    }
];
const messages = [];
// console.log(stripHtml(test).result.trim());

setInterval(() => {
    participants.forEach(p => {
        if((Date.now() - p.lastStatus) > 10000) {
            messages.push({
                from: p.name,
                to: "Todos",
                text: "sai da sala...",
                type: "status",
                time: dayjs().format('hh:mm:ss')
            });
        }
    })
    participants = participants.filter(p => Date.now() - p.lastStatus <= 10000)
}, 15000);

server.post(`/participants`, (req, res) => {
    const name = stripHtml(req.body.name).result.trim();
    const newUser = {
        name,
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
        res.status(200).send(participants);
    }
});

server.get(`/participants`, (req, res) => {
    res.send(participants);
})

server.post(`/messages`, (req, res) => {
    const newMessage = {
        from: stripHtml(req.headers.user).result.trim(),
        to: stripHtml(req.body.to).result.trim(),
        text: stripHtml(req.body.text).result.trim(),
        type: stripHtml(req.body.type).result.trim(),
        time: dayjs().format('hh:mm:ss')
    };
    if(!newMessage.to || !newMessage.text || (newMessage.type !== "message" && newMessage.type !== "private_message") || !participants.find(p => p.name === newMessage.from)) {
        res.sendStatus(400);
    }
    else {
        messages.push(newMessage);
        res.status(200).send(messages);
    }
});

server.get(`/messages`, (req, res) => {
    const userLoggedIn = req.headers.user;
    const visibleMessages = messages.filter(m => m.from === userLoggedIn || m.to === userLoggedIn || m.to === "Todos" || m.type !== "private_message");
    if(req.query.limit) {
        res.send(visibleMessages.filter((m, i) => i<req.query.limit));
    }
    else {
        res.send(visibleMessages);
    }
});

server.post(`/status`, (req, res) => {
    const userToCheck = req.headers.user;
    if(!participants.find(p => p.name === userToCheck)) {
        res.sendStatus(400);
    }
    else {
        participants.forEach(p => {
            if(p.name === userToCheck) {
                p.lastStatus = Date.now();
            }
        });
        res.sendStatus(200);
    }
});

server.listen(4000);