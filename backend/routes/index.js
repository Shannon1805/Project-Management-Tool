import express from 'express';
import joi from 'joi';
import mongoose from 'mongoose';
import Project from '../models/index.js';

const api = express.Router();

// ----------------- GET PROJECTS -----------------
api.get('/projects', async (req, res) => {
    try {
        const data = await Project.find({}, { task: 0, __v: 0, updatedAt: 0 });
        return res.send(data);
    } catch (error) {
        return res.send(error);
    }
});

api.get('/project/:id', async (req, res) => {
    if (!req.params.id) res.status(422).send({ data: { error: true, message: 'Id is required' } });
    try {
        const data = await Project.find({ _id: mongoose.Types.ObjectId(req.params.id) }).sort({ order: 1 });
        return res.send(data);
    } catch (error) {
        return res.send(error);
    }
});

// ----------------- CREATE PROJECT -----------------
api.post('/project', async (req, res) => {
    const io = req.app.get('io'); // <-- Socket.IO instance

    const projectSchema = joi.object({
        title: joi.string().min(3).max(30).required(),
        description: joi.string().required(),
    });

    const { error, value } = projectSchema.validate({ title: req.body.title, description: req.body.description });
    if (error) return res.status(422).send(error);

    try {
        const data = await new Project(value).save();

        // Emit notification
        io.emit('notification', `New project "${data.title}" created!`);

        res.send({ data: { title: data.title, description: data.description, updatedAt: data.updatedAt, _id: data._id } });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(422).send({ data: { error: true, message: 'title must be unique' } });
        } else {
            return res.status(500).send({ data: { error: true, message: 'server error' } });
        }
    }
});

// ----------------- UPDATE PROJECT -----------------
api.put('/project/:id', async (req, res) => {
    const io = req.app.get('io'); // <-- Socket.IO instance

    const projectSchema = joi.object({
        title: joi.string().min(3).max(30).required(),
        description: joi.string().required(),
    });

    const { error, value } = projectSchema.validate({ title: req.body.title, description: req.body.description });
    if (error) return res.status(422).send(error);

    Project.updateOne({ _id: mongoose.Types.ObjectId(req.params.id) }, { ...value }, { upsert: true }, (error, data) => {
        if (error) {
            res.send(error);
        } else {
            // Emit notification
            io.emit('notification', `Project "${value.title}" was updated!`);
            res.send(data);
        }
    });
});

// ----------------- DELETE PROJECT -----------------
api.delete('/project/:id', async (req, res) => {
    const io = req.app.get('io'); // <-- Socket.IO instance

    try {
        const data = await Project.deleteOne({ _id: mongoose.Types.ObjectId(req.params.id) });

        // Emit notification
        io.emit('notification', `A project was deleted!`);

        res.send(data);
    } catch (error) {
        res.send(error);
    }
});

// ----------------- TASKS -----------------
api.post('/project/:id/task', async (req, res) => {
    const io = req.app.get('io'); // <-- Socket.IO instance

    if (!req.params.id) return res.status(500).send(`server error`);

    const taskSchema = joi.object({
        title: joi.string().min(3).max(30).required(),
        description: joi.string().required(),
    });

    const { error, value } = taskSchema.validate({ title: req.body.title, description: req.body.description });
    if (error) return res.status(422).send(error);

    try {
        const [{ task }] = await Project.find({ _id: mongoose.Types.ObjectId(req.params.id) }, { "task.index": 1 }).sort({ 'task.index': 1 });
        let countTaskLength = [task.length, task.length > 0 ? Math.max(...task.map(o => o.index)) : task.length];

        const data = await Project.updateOne(
            { _id: mongoose.Types.ObjectId(req.params.id) },
            { $push: { task: { ...value, stage: "Requested", order: countTaskLength[0], index: countTaskLength[1] + 1 } } }
        );

        // Emit notification
        io.emit('notification', `New task "${value.title}" added to project!`);

        return res.send(data);
    } catch (error) {
        return res.status(500).send(error);
    }
});

// ----------------- UPDATE TASK -----------------
api.put('/project/:id/task/:taskId', async (req, res) => {
    const io = req.app.get('io'); // <-- Socket.IO instance

    if (!req.params.id || !req.params.taskId) return res.status(500).send(`server error`);

    const taskSchema = joi.object({
        title: joi.string().min(3).max(30).required(),
        description: joi.string().required(),
    });

    const { error, value } = taskSchema.validate({ title: req.body.title, description: req.body.description });
    if (error) return res.status(422).send(error);

    try {
        const data = await Project.updateOne(
            { _id: mongoose.Types.ObjectId(req.params.id), task: { $elemMatch: { _id: mongoose.Types.ObjectId(req.params.taskId) } } },
            { $set: { "task.$.title": value.title, "task.$.description": value.description } }
        );

        // Emit notification
        io.emit('notification', `Task "${value.title}" was updated!`);

        return res.send(data);
    } catch (error) {
        return res.send(error);
    }
});

// ----------------- DELETE TASK -----------------
api.delete('/project/:id/task/:taskId', async (req, res) => {
    const io = req.app.get('io'); // <-- Socket.IO instance

    if (!req.params.id || !req.params.taskId) return res.status(500).send(`server error`);

    try {
        const data = await Project.updateOne(
            { _id: mongoose.Types.ObjectId(req.params.id) },
            { $pull: { task: { _id: mongoose.Types.ObjectId(req.params.taskId) } } }
        );

        // Emit notification
        io.emit('notification', `A task was deleted!`);

        return res.send(data);
    } catch (error) {
        return res.send(error);
    }
});

export default api;
