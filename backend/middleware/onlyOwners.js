function onlyOwnersMiddleware(req, res, next) {
    const user = req.user;

    if (user.type !== 'owner') return res.redirect('/home');

    next();
}

export default onlyOwnersMiddleware;