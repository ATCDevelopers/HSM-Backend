import {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import {useAuth} from "@/auth/AuthContext";
import Guest from "../../components/layouts/Guest";
import Input from "../../components/atoms/forms/Input";
import Button from "../../components/atoms/ui/Button";
import Alert from "../../components/atoms/ui/Alert";

/**
 * Login page — email/password sign-in.
 *
 * Field-level validation errors (422) are surfaced under each input; the
 * generic "invalid credentials" case (401) is shown as a top-level alert.
 */
function Login() {
    const {login} = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({email: "", password: ""});
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
            await login(form);
            navigate("/", {replace: true});
        } catch (err) {
            const status = err.response?.status;
            if (status === 422) {
                setErrors(err.response.data.errors || {});
            } else if (status === 401) {
                setMessage(err.response.data.message || "Invalid credentials.");
            } else {
                setMessage("Something went wrong. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Guest title="Sign in" subtitle="Welcome back to your application">
            {message && (
                <Alert type="error" className="mb-4">
                    {message}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    error={errors.email?.[0]}
                    placeholder="you@example.com"
                    required
                />

                <Input
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    error={errors.password?.[0]}
                    placeholder="Enter your password"
                    required
                />

                <Button type="submit" loading={submitting} className="w-full">
                    Sign in
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link to="/register"
                      className="text-blue-600 hover:text-blue-800 font-medium">
                    Create one
                </Link>
            </p>
        </Guest>
    );
}

export default Login;
