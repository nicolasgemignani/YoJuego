export const mostrarHome = (req, res) => {
  // res.locals ya tiene 'isAuthenticated' y 'user' gracias a tu middleware 'cargarUsuarioGlobal'
  // Así que Handlebars los lee automáticamente sin necesidad de pasarlos en el objeto
  res.render('web/home');
};