const jwt = require('jsonwebtoken');
const {Student} = require(path.resolve(__dirname,'../models/Student'));

async function loginUser(req, res) {
    const { email, password } = req.body;

    try {
        console.log("email: ", email, " password: ", password)
        const student = await Student.findOne({ where: { email } });

        if (!student || student.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const now = new Date();
        const lastLogin = student.lastLogin ? new Date(student.lastLogin) : null;

        let daysSinceLastLogin = lastLogin 
            ? Math.floor((now - lastLogin) / (24 * 60 * 60 * 1000)) 
            : null;

        if (daysSinceLastLogin === 1) {
            student.frequency += 1; 
        } else if (daysSinceLastLogin > 1 || daysSinceLastLogin === null) {
            student.frequency = 1; 
        }

        student.lastLogin = now; 

        await student.save();

        const token = jwt.sign({ id: student.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token, studentId: student.id });
    } catch (error) {
        console.log(error.message )
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
}


async function getUser(req, res) {
    const { studentId } = req.params;

    try {
        const student = await Student.findOne({ where: { id: parseInt(studentId, 10) } });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const { email, fname, lname, frequency } = student;

        res.json({ message: 'Login successful', student: { email, fname, lname, frequency } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
}

module.exports = { 
    loginUser,
    getUser
};