import React from "react";

export function Footer({
  brandName = "GKIN RWDH Dienst Dashboard",
  copyrightOwner = "GKIN RWDH",
}) {
  return (
    <footer className="mt-6 md:mt-8 pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto px-3 md:px-6">
        <div className="border-t border-gray-200 pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1 rounded-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div className="font-medium text-sm text-gray-800">
                {brandName}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} {copyrightOwner}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
