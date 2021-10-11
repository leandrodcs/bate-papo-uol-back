import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import { stripHtml } from "string-strip-html";
import Joi from 'joi';
import fs from 'fs';

const server = express();
server.use(cors());
server.use(express.json());

let participants = JSON.parse(fs.readFileSync(`database.json`)).participants;
const messages = JSON.parse(fs.readFileSync(`database.json`)).messages;


// fs.writeFileSync(`database.json`, JSON.stringify({participants, messages}));

console.log(participants, messages)

const validateParticipant = data => {
    const schema = Joi.object({
        name: Joi.string().min(1).max(20).required()
    }).unknown();

    return schema.validate(data).error;
}

const validateMessage = data => {
    const schema = Joi.object({
        to: Joi.string().min(1).required(),
        text: Joi.string().min(1).required(),
        type: Joi.string().valid("message").valid("private_message").required()
    }).unknown();
    
    return schema.validate(data).error;
}

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
    fs.writeFileSync(`database.json`, JSON.stringify({participants, messages}));
}, 15000);

server.post(`/participants`, (req, res) => {
    const name = stripHtml(req.body.name).result.trim();
    const newUser = {
        name,
        lastStatus: Date.now()
    }
    if(participants.find((p) => p.name === newUser.name) || validateParticipant(newUser)) {
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
        );
        fs.writeFileSync(`database.json`, JSON.stringify({participants, messages}));
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
    if(!participants.find(p => p.name === newMessage.from) || validateMessage(newMessage)) {
        res.sendStatus(400);
    }
    else {
        messages.push(newMessage);
        fs.writeFileSync(`database.json`, JSON.stringify({participants, messages}));
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