module.exports = (req, res, next) => {
    if (req.user && req.user.roles === "admin") {
        next(); // Proceed if user is admin
    } else {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
};
