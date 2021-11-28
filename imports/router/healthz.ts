export default (req, res) => {
  return res.status(200).json({docker: +!!process.env.DOCKER});
};