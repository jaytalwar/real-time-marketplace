import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import toast from "react-hot-toast";

import { registerUser } from "../services/authService";

export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({

    name: "",

    email: "",

    password: "",

    role: "buyer",

  });

  const handleChange = (e) => {

    setForm({

      ...form,

      [e.target.name]: e.target.value,

    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await registerUser(form);

      toast.success("Registration Successful");

      navigate("/login");

    } catch (err) {

      toast.error(

        err.response?.data?.message ||

        "Registration Failed"

      );

    }

  };

  return (

    <div

      style={{

        width: "400px",

        margin: "60px auto",

      }}

    >

      <h2>Register</h2>

      <form onSubmit={handleSubmit}>

        <input

          name="name"

          placeholder="Name"

          value={form.name}

          onChange={handleChange}

        />

        <br /><br />

        <input

          name="email"

          placeholder="Email"

          value={form.email}

          onChange={handleChange}

        />

        <br /><br />

        <input

          type="password"

          name="password"

          placeholder="Password"

          value={form.password}

          onChange={handleChange}

        />

        <br /><br />

        <select

          name="role"

          value={form.role}

          onChange={handleChange}

        >

          <option value="buyer">

            Buyer

          </option>

          <option value="seller">

            Seller

          </option>

        </select>

        <br /><br />

        <button type="submit">

          Register

        </button>

      </form>

      <br />

      <Link to="/login">

        Already have an account?

      </Link>

    </div>

  );

}