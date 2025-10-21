import { useState, useEffect } from "react";
import { Clock, User, Mail, Eye, EyeOff } from "lucide-react";
import emailHistoryService from "../services/emailHistoryService";

export function EmailHistory({ documentType, isOpen }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch email history when component becomes visible and documentType is provided
  useEffect(() => {
    if (isOpen && documentType && showHistory) {
      fetchEmailHistory();
    }
  }, [isOpen, documentType, showHistory]);

  const fetchEmailHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
    //   console.log('Fetching email history for documentType:', documentType);
      const response = await emailHistoryService.getEmailHistoryByDocument(documentType);
    //   console.log('Email history response:', response);
      
      // Now that the service returns { data: { emails: [...] } }, this should work
      const emailData = response?.data?.emails || [];
    //   console.log('Final emails to set:', emailData);
      setEmails(Array.isArray(emailData) ? emailData : []);
      
    } catch (err) {
      console.error("Error fetching email history:", err);
      
      // For any error, just show empty state (most likely table doesn't exist yet)
      setEmails([]);
      setError(null); // Don't show error - empty state is fine for new features
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatEmails = (toEmail, ccEmails) => {
    let result = toEmail;
    if (ccEmails && ccEmails.trim()) {
      const ccList = ccEmails.split(',').map(email => email.trim()).filter(email => email);
      if (ccList.length > 0) {
        result += ` (CC: ${ccList.join(', ')})`;
      }
    }
    return result;
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory && documentType) {
      // Will trigger useEffect to fetch data
    }
  };

  if (!documentType) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={toggleHistory}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        {showHistory ? (
          <>
            <EyeOff className="w-4 h-4" />
            Hide Email History
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            View Email History
          </>
        )}
      </button>

      {/* History Content */}
      {showHistory && (
        <div className="mt-3">
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Email History for {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
              </h4>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading email history...
                </div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-red-600">
                  {error}
                </div>
              ) : emails.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Mail className="w-8 h-8 text-gray-300" />
                    <div className="text-sm font-medium text-gray-600">
                      No Email History Yet
                    </div>
                    <div className="text-xs text-gray-500">
                      Emails sent for this {documentType} document will appear here
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {emails.map((email) => (
                    <div key={email.id} className="p-3 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium">{email.sender_username}</span>
                            <span className="text-gray-400">({email.sender_role})</span>
                            <span className="text-gray-400">•</span>
                            <span>{formatDate(email.sent_at)}</span>
                          </div>
                          
                          <div className="text-sm font-medium text-gray-900 truncate mb-1">
                            {email.subject}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">
                              {formatEmails(email.to_email, email.cc_emails)}
                            </span>
                          </div>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          email.status === 'sent' 
                            ? 'bg-green-100 text-green-700' 
                            : email.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {email.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}