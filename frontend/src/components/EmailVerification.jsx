import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { CheckCircle, XCircle, Package, Loader } from 'lucide-react';

const EmailVerification = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(response.data.message);

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Verification failed. Please try again.');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="flex items-center justify-center mb-8">
                    <div className="bg-blue-600 p-3 rounded-xl">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
                    Email Verification
                </h1>

                {status === 'verifying' && (
                    <div className="text-center">
                        <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-600">Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <p className="text-green-700 font-semibold mb-2">{message}</p>
                        <p className="text-gray-600 text-sm">Redirecting to login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <p className="text-red-700 font-semibold mb-4">{message}</p>
                        <Link
                            to="/login"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailVerification;
