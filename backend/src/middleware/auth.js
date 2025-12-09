exports.protect = async (req, res, next) => {
  let token;

  // Check for token in query parameter (for SSE endpoints)
  if (req.query.token) {
    token = req.query.token;
  }
  // Check Authorization header (normal requests)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};
