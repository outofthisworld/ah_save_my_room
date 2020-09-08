import React from "react";
import "antd/dist/antd.css";
import {
  CardElement,
  ElementsConsumer,
  Elements
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  useRouteMatch,
  useHistory,
  useParams,
  Switch,
  Route,
  BrowserRouter
} from "react-router-dom";
import { Button, message, Form, Input, Checkbox } from "antd";

const stripe_public_key = "pk_live_O8PBVHZqwYIhAhimpDwyaaPt00s7EefB7N";

const CheckoutForm = ({ stripe, elements, location }) => {
  const { amount, currency } = useParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [agreeTOC, setAgreeTOC] = React.useState(false);
  const queryParams = new URLSearchParams(location.search);

  const handleSubmit = React.useCallback(
    async values => {
      console.log(values);

      if (!agreeTOC) {
        return message.error(
          "Please confirm that you agree to the terms and conditions"
        );
      }

      setIsSubmitting(true);

      if (!stripe || !elements) {
        // Stripe.js has not loaded yet. Make sure to disable
        // form submission until Stripe.js has loaded.
        return;
      }

      // Get a reference to a mounted CardElement. Elements knows how
      // to find your CardElement because there can only ever be one of
      // each type of element.
      const cardElement = elements.getElement(CardElement);

      try {
        const token = await stripe.createSource(cardElement, {
          usage: "single_use",
          currency: "nzd",
          type: "card",
          owner: {
            name: `${queryParams.get("firstName")} ${queryParams.get(
              "lastName"
            )}`,
            email: `${queryParams.get("email")}`
          },
          metadata: {
            roomNumber: `${queryParams.get("roomNumber")}`,
            propertyAddress: `${queryParams.get("propertyAddress")}`,
            amount: `${queryParams.get("amount")}`,
            currency: `${queryParams.get("currency")}`
          },
          statement_descriptor: "Allhouse save my room payment."
        });

        if (token.error) {
          throw token.error;
        }

        const res = await fetch(
          `/api/stripe/charge/${token.source.id}/${queryParams.get('amount')}/NZD`,
          {
            method: "POST"
          }
        );

        const jsonRes = await res.json();

        if (jsonRes.status === 201) {
          message.success("Payment completed succesfully");
          setTimeout(() => {
            window.location.href = "https://www.allhouse.nz";
          }, 1000);
        } else {
          throw new Error("Error processing payment, invalid server response");
        }

        setIsSubmitting(false);
      } catch (err) {
        message.error(`Error processing payment`);
        console.log(err);
      }
    },
    [amount, currency, agreeTOC, location]
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fefefe",
        paddingTop:10,
        paddingBottom:10
      }}
    >
      <Form
        layout="vertical"
        size="middle"
        name="applyRoom"
        onFinish={handleSubmit}
        initialValues={{
          firstName: queryParams.get("firstName"),
          lastName: queryParams.get("lastName"),
          email: queryParams.get("email"),
          propertyAddress: queryParams.get("propertyAddress"),
          roomNumber: queryParams.get("roomNumber")
        }}
        style={{
          backgroundColor: "#fff",
          padding: 40,
          boxShaow: "0px -1px 2px 2px #f3f3f3",
          maxWidth: 600
        }}
      >
        <h1>Save your room with Allhouse.</h1>
        <p className={"mt-4"}>
          Completing this form authorizes Allhouse to debit your card $
          {queryParams.get("amount")} NZD.
        </p>
        <small>
          This will secure and lock your room in whilst background checks are
          being conducted. This money constitutes one-weeks advanced rent and
          should you not pass the required checks will be fully refunded.
        </small>
        <Form.Item
          name={["firstName"]}
          label="First name"
          style={{ marginTop: 10 }}
          rules={[
            {
              required: true,
              message: "Please enter your first name"
            }
          ]}
        >
          <Input type="text" placholder="First name" required />
        </Form.Item>
        <Form.Item
          name={["lastName"]}
          label="Last Name"
          className={"mt-2"}
          rules={[
            {
              required: true,
              message: "Please enter your last name"
            }
          ]}
        >
          <Input type="text" placholder="Last Name" required />
        </Form.Item>
        <Form.Item
          name={["email"]}
          label="Email"
          className={"mt-2"}
          rules={[
            {
              required: true,
              message: "Please enter your email address"
            }
          ]}
        >
          <Input type="email" placholder="Email" required />
        </Form.Item>
        <Form.Item
          name={["propertyAddress"]}
          label="Property Address"
          className={"mt-2"}
          rules={[
            {
              required: true,
              message: "Please enter the property address"
            }
          ]}
        >
          <Input disabled type="text" placholder="Property Address" required />
        </Form.Item>
        <Form.Item
          name={["roomNumber"]}
          label="Room Number"
          className={"mt-2"}
          rules={[
            {
              required: true,
              message: "Please enter the room number to save"
            }
          ]}
        >
          <Input disabled type="text" placholder="roomNumber" required />
        </Form.Item>
        <CardElement
          required
          className={"mt-5"}
          options={{
            style: {
              width: "100%",
              base: {
                fontSize: "16px",
                color: "#000",
                width: "100%",
                "::placeholder": {
                  color: "#000"
                }
              },
              invalid: {
                color: "#9e2146"
              }
            }
          }}
        />
        <Checkbox
          style={{ marginTop: 20 }}
          onChange={() => setAgreeTOC(!agreeTOC)}
        >
          I agree and understand the terms of payment
        </Checkbox>
        <Button
          htmlType="submit"
          type="primary"
          style={{ marginTop: 40 }}
          block
          loading={isSubmitting}
        >
          Pay
        </Button>
      </Form>
    </div>
  );
};

const Checkout = props => {
  return (
    <Elements
      stripe={loadStripe(stripe_public_key)}
    >
      <ElementsConsumer>
        {({ elements, stripe }) => (
          <CheckoutForm {...props} elements={elements} stripe={stripe} />
        )}
      </ElementsConsumer>
    </Elements>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/savemyroom" component={Checkout} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
