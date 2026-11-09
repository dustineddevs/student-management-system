
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET - Display all students
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM students ORDER BY id DESC'
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch students.' });
    }
});

// POST - Add a student
router.post('/', async (req, res) => {
    try {
        const {
            student_number,
            first_name,
            last_name,
            email,
            course,
            year_level,
            status
        } = req.body;

        if (!student_number || !first_name || !last_name ||
            !email || !course || !year_level) {
            return res.status(400).json({
                message: 'Please complete all required fields.'
            });
        }

        const result = await pool.query(
            `INSERT INTO students
            (student_number, first_name, last_name, email, course, year_level, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                student_number,
                first_name,
                last_name,
                email,
                course,
                year_level,
                status || 'Active'
            ]
        );

        res.status(201).json({
            message: 'Student added successfully!',
            student: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Student number or email already exists.'
            });
        }

        res.status(500).json({ message: 'Failed to add student.' });
    }
});

// PUT - Update a student
router.put('/:id', async (req, res) => {
    try {
        const {
            student_number,
            first_name,
            last_name,
            email,
            course,
            year_level,
            status
        } = req.body;

        if (!student_number || !first_name || !last_name ||
            !email || !course || !year_level) {
            return res.status(400).json({
                message: 'Please complete all required fields.'
            });
        }

        const result = await pool.query(
            `UPDATE students
            SET student_number = $1,
                first_name = $2,
                last_name = $3,
                email = $4,
                course = $5,
                year_level = $6,
                status = $7
            WHERE id = $8
            RETURNING *`,
            [
                student_number,
                first_name,
                last_name,
                email,
                course,
                year_level,
                status || 'Active',
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Student not found.'
            });
        }

        res.json({
            message: 'Student updated successfully!',
            student: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Student number or email already exists.'
            });
        }

        res.status(500).json({ message: 'Failed to update student.' });
    }
});

// DELETE - Delete a student
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM students WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Student not found.'
            });
        }

        res.json({ message: 'Student deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete student.' });
    }
});

module.exports = router;

