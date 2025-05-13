import React, { useState } from 'react';
import { Calendar, Clock, MessageSquare, Droplet, Users, BarChart } from 'lucide-react';

const Guide = () => {
  const [activeTab, setActiveTab] = useState<'farmer' | 'agent'>('farmer');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl font-bold text-center mb-6">
            Welcome to Boma Bora Guide
          </h1>
          <p className="text-xl text-center text-blue-100 max-w-3xl mx-auto">
            Learn how to use our milk collection system efficiently and effectively
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="sm:hidden">
            <select
              className="block w-full rounded-md border-gray-300"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as 'farmer' | 'agent')}
            >
              <option value="farmer">I'm a Farmer</option>
              <option value="agent">I'm an Agent</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('farmer')}
                className={`${
                  activeTab === 'farmer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md flex items-center space-x-2 flex-1 justify-center`}
              >
                <Users className="h-5 w-5" />
                <span>I'm a Farmer</span>
              </button>
              <button
                onClick={() => setActiveTab('agent')}
                className={`${
                  activeTab === 'agent'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md flex items-center space-x-2 flex-1 justify-center`}
              >
                <Users className="h-5 w-5" />
                <span>I'm an Agent</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature Cards */}
          {activeTab === 'farmer' ? (
            <>
              {/* Farmer Dashboard */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Dashboard Overview</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm mr-2 mt-0.5">
                      1
                    </span>
                    View total milk collected
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm mr-2 mt-0.5">
                      2
                    </span>
                    Track collection history
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm mr-2 mt-0.5">
                      3
                    </span>
                    Monitor average production
                  </li>
                </ul>
              </div>

              {/* Upcoming Collections */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upcoming Collections</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm mr-2 mt-0.5">
                      1
                    </span>
                    See scheduled collection times
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm mr-2 mt-0.5">
                      2
                    </span>
                    Read agent notes and instructions
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm mr-2 mt-0.5">
                      3
                    </span>
                    Get real-time status updates
                  </li>
                </ul>
              </div>

              {/* Communication */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Communication</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm mr-2 mt-0.5">
                      1
                    </span>
                    Chat with your agent
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm mr-2 mt-0.5">
                      2
                    </span>
                    Receive important notifications
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm mr-2 mt-0.5">
                      3
                    </span>
                    Stay updated on changes
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Agent Dashboard */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Managing Collections</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm mr-2 mt-0.5">
                      1
                    </span>
                    Schedule new collections
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm mr-2 mt-0.5">
                      2
                    </span>
                    View all scheduled collections
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm mr-2 mt-0.5">
                      3
                    </span>
                    Track collection progress
                  </li>
                </ul>
              </div>

              {/* Recording Collections */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Droplet className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Recording Collections</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm mr-2 mt-0.5">
                      1
                    </span>
                    Record milk quantities
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm mr-2 mt-0.5">
                      2
                    </span>
                    Add collection notes
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm mr-2 mt-0.5">
                      3
                    </span>
                    Update collection status
                  </li>
                </ul>
              </div>

              {/* Farmer Communication */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Farmer Communication</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm mr-2 mt-0.5">
                      1
                    </span>
                    Message farmers directly
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm mr-2 mt-0.5">
                      2
                    </span>
                    Send collection reminders
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm mr-2 mt-0.5">
                      3
                    </span>
                    Manage farmer relationships
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Detailed Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Detailed Instructions</h2>
          {activeTab === 'farmer' ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h3>
                <div className="prose prose-blue max-w-none">
                  <ol className="list-decimal pl-4 space-y-4">
                    <li>
                      <strong>Access Your Dashboard:</strong>
                      <p className="text-gray-600 mt-1">
                        Log in to your account to view your personalized dashboard showing your milk
                        collection statistics and upcoming collections.
                      </p>
                    </li>
                    <li>
                      <strong>View Upcoming Collections:</strong>
                      <p className="text-gray-600 mt-1">
                        Check the "Upcoming Collections" section to see when your next milk collection is
                        scheduled. Each collection shows the date, time, and any special notes from your
                        agent.
                      </p>
                    </li>
                    <li>
                      <strong>Track Your Progress:</strong>
                      <p className="text-gray-600 mt-1">
                        Monitor your total milk production, number of collections, and average
                        collection quantity in the statistics panel at the top of your dashboard.
                      </p>
                    </li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Features</h3>
                <div className="prose prose-blue max-w-none">
                  <ul className="list-disc pl-4 space-y-4">
                    <li>
                      <strong>Messaging Your Agent:</strong>
                      <p className="text-gray-600 mt-1">
                        Use the messaging feature to communicate directly with your agent about
                        collections, schedule changes, or any concerns.
                      </p>
                    </li>
                    <li>
                      <strong>Notifications:</strong>
                      <p className="text-gray-600 mt-1">
                        Receive instant notifications for new messages, scheduled collections, and
                        collection confirmations.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Managing Collections</h3>
                <div className="prose prose-blue max-w-none">
                  <ol className="list-decimal pl-4 space-y-4">
                    <li>
                      <strong>Schedule a Collection:</strong>
                      <p className="text-gray-600 mt-1">
                        Click "Schedule Collection", select a farmer, set the date and time, and add any
                        special notes or instructions.
                      </p>
                    </li>
                    <li>
                      <strong>Record a Collection:</strong>
                      <p className="text-gray-600 mt-1">
                        When a collection is completed, click "Record Collection", enter the quantity
                        collected, and add any relevant notes about the collection.
                      </p>
                    </li>
                    <li>
                      <strong>Monitor Collections:</strong>
                      <p className="text-gray-600 mt-1">
                        Use the tabs to switch between upcoming and completed collections. View
                        collection details, quantities, and status updates.
                      </p>
                    </li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Farmer Management</h3>
                <div className="prose prose-blue max-w-none">
                  <ul className="list-disc pl-4 space-y-4">
                    <li>
                      <strong>Communication:</strong>
                      <p className="text-gray-600 mt-1">
                        Use the messaging system to send updates, reminders, or respond to farmer
                        inquiries. Look for the red notification indicators for unread messages.
                      </p>
                    </li>
                    <li>
                      <strong>Collection History:</strong>
                      <p className="text-gray-600 mt-1">
                        View each farmer's collection history, including quantities, dates, and any
                        notes or issues recorded during collection.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Guide;
