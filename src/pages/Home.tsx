import React from 'react';
import { Link } from 'react-router-dom';
import { Milk, Users, Calendar, MessageSquare } from 'lucide-react';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Boma Bora
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Streamlining milk collection for dairy farmers and agents
        </p>
        <Link
          to="/register"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <Milk className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Milk Collection</h3>
          <p className="text-gray-600">
            Efficiently track and manage milk collections with real-time updates
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <Users className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Farmer Management</h3>
          <p className="text-gray-600">
            Easily manage farmer profiles and collection records
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <Calendar className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Schedule Planning</h3>
          <p className="text-gray-600">
            Organize collection schedules and optimize routes
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <MessageSquare className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Communication</h3>
          <p className="text-gray-600">
            Direct messaging between farmers and agents
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to modernize your dairy operations?
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Join Boma Bora today and experience seamless milk collection management
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign Up Now
          </Link>
          <Link
            to="/login"
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;