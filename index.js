const express = require("express");
const app = express();
const path = require("path");

const PORT = process.env.NODE_ENV === "production" ? process.env.PORT : 3002;

const apiRouter = express.Router();

const stripe = require("stripe")(
  "**INSERT STRIPE PRIVATE KEY**"
);

const buildFolder = path.join(__dirname, "build");
app.set("view engine", "ejs");
app.use(express.static(buildFolder));
app.set("views", buildFolder);
app.engine("html", require("ejs").renderFile);

app.use((req,res,next)=>{
    console.log('Incoming request for url: ', req.url);
    next();
})

apiRouter.post(
  "/stripe/charge/:token/:amount/:currency",
  (req, res, next) => {
    const { amount, currency } = req.params;

    console.log('responding')

    return stripe.charges.create(
      {
        amount: Number(amount) * 100,
        currency: "nzd",
        source: req.params.token,
        description: "Save My Room Payment"
      },
      function(err, charge) {
        if (err) return next(err);
        else {
          return res.status(201).json({ status: 201, result: charge });
        }
      }
    );
  },
  (err, req, res, next) => {
    console.log(err);
    return res.status(500).json({ status: 500, errors: [err.message] });
  }
);

//Catch all api routes
app.use("/api", apiRouter);

//Send back react page for all other routes
app.all("/*", (req, res, next) => {
  return res.render("index.html");
});

//Catch all errors
app.use((err, req, res, next) => {
  return res.status(500).json({ status: 500, errors: [err.message] });
});

app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
