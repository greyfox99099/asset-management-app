import { useState } from 'react';
import axios from 'axios';
import { Mail, ExternalLink } from 'lucide-react';

const DevVerificationHelper = () => {
    const [email, setEmail] = useState('');
    const [verificationLink, setVerificationLink] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getVerificationLink = async () => {
        if (!email) {
            setError('Please enter an email');
            return;
        }

        setLoading(true);
        setError('');
        setVerificationLink('');

        try {
            const response = await axios.get(`http://localhost:5001/api/auth/dev/verification-link/${email}`);
            setVerificationLink(response.data.verificationLink);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to get verification link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="flex items-center justify-center mb-6">
                    <div className="bg-orange-600 p-3 rounded-xl">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Development Helper
                </h1>
                <p className="text-center text-gray-500 mb-6 text-sm">
                    Get verification link without checking email
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                    <p className="text-xs text-yellow-800">
                        ⚠️ This is for development only. Remove in production!
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter registered email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && getVerificationLink()}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="user@example.com"
                        />
                    </div>

                    <button
                        onClick={getVerificationLink}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Getting link...' : 'Get Verification Link'}
                    </button>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {verificationLink && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-900 mb-2">
                                Verification Link:
                            </p>
                            <div className="bg-white rounded p-3 mb-3 break-all text-sm text-gray-700">
                                {verificationLink}
                            </div>
                            <a
                                href={verificationLink}
                                className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                            >
                                <ExternalLink size={18} />
                                Click to Verify
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DevVerificationHelper;
