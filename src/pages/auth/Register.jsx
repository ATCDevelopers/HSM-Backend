import {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import {useAuth} from "../../auth/AuthContext";
import Guest from "../../components/layouts/Guest";
import Input from "../../components/atoms/forms/Input";
import Button from "../../components/atoms/ui/Button";
import Alert from "../../components/atoms/ui/Alert";

const INITIAL_FORM = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    passwordConfirmation: "",
};

/**
 * Register page — creates an account and signs the user straight in.
 *
 * Field names are camelCase; the api interceptor converts them to the
 * snake_case the Laravel RegisterRequest expects (firstName -> first_name,
 * passwordConfirmation -> password_confirmation). Validation errors come back
 * keyed by the camelCased field name.
 */
function Register() {
    const {register} = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (field) => (e) => {
        setForm((prev) => ({...prev, [field]: e.target.value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setMessage("");
        setSubmitting(true);

        try {
            await register(form);
            navigate("/", {replace: true});
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                setMessage("Something went wrong. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Guest title="Create account"
               subtitle="Get started with your application">
            {message && (
                <Alert type="error" className="mb-4">
                    {message}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First name"
                        value={form.firstName}
                        onChange={handleChange("firstName")}
                        error={errors.firstName?.[0]}
                        required
                    />
                    <Input
                        label="Last name"
                        value={form.lastName}
                        onChange={handleChange("lastName")}
                        error={errors.lastName?.[0]}
                        required
                    />
                </div>

                <Input
                    label="Username"
                    value={form.username}
                    onChange={handleChange("username")}
                    error={errors.username?.[0]}
                    required
                />

                <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    error={errors.email?.[0]}
                    required
                />

                <Input
                    label="Phone number"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={handleChange("phoneNumber")}
                    error={errors.phoneNumber?.[0]}
                />

                <Input
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    error={errors.password?.[0]}
                    required
                />

                <Input
                    label="Confirm password"
                    type="password"
                    value={form.passwordConfirmation}
                    onChange={handleChange("passwordConfirmation")}
                    required
                />

                <Button type="submit" loading={submitting} className="w-full">
                    Create account
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login"
                      className="text-blue-600 hover:text-blue-800 font-medium">
                    Sign in
                </Link>
            </p>
        </Guest>
    );
}

export default Register;
