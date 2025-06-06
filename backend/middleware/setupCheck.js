function setupCheckMiddleware(req, res, next) {
    if (!req.user.setupComplete) {
        if (req.user.type === 'customer') return res.redirect('/finalize');
        else return res.redirect('/restaurant/add');
    }
    next();
}

export default setupCheckMiddleware;