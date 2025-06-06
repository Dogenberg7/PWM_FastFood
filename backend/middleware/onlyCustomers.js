function onlyCustomersMiddleware(req, res, next) {
    const user = req.user;

    if (user.type !== 'customer') return res.redirect('/home');

    next();
}

export default onlyCustomersMiddleware;