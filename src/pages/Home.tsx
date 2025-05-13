import React from 'react';
import { Link } from 'react-router-dom';
import { Milk, Users, Calendar, MessageSquare, BookOpen, ArrowRight } from 'lucide-react';
import hero from '../assets/hero.png';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="w-full max-w-[1400px] mx-auto">
        <img 
          src={hero}
          alt="Boma Bora Milk - Connecting farmers and agents" 
          className="w-full h-auto"
        />
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-xl text-gray-600">
            Comprehensive tools for efficient milk collection management
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <Milk className="h-12 w-12 text-[#0E5C3F] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Milk Collection</h3>
            <p className="text-gray-600 mb-4">
              Efficiently track and manage milk collections with real-time updates
            </p>
            <Link
              to="/guide"
              className="text-[#0E5C3F] hover:text-[#0b4832] inline-flex items-center text-sm font-medium"
            >
              Learn more
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <Users className="h-12 w-12 text-[#0E5C3F] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Farmer Management</h3>
            <p className="text-gray-600 mb-4">
              Easily manage farmer profiles and collection records
            </p>
            <Link
              to="/guide"
              className="text-[#0E5C3F] hover:text-[#0b4832] inline-flex items-center text-sm font-medium"
            >
              Learn more
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <Calendar className="h-12 w-12 text-[#0E5C3F] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Schedule Planning</h3>
            <p className="text-gray-600 mb-4">
              Organize collection schedules and optimize routes
            </p>
            <Link
              to="/guide"
              className="text-[#0E5C3F] hover:text-[#0b4832] inline-flex items-center text-sm font-medium"
            >
              Learn more
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <MessageSquare className="h-12 w-12 text-[#0E5C3F] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Communication</h3>
            <p className="text-gray-600 mb-4">
              Direct messaging between farmers and agents
            </p>
            <Link
              to="/guide"
              className="text-[#0E5C3F] hover:text-[#0b4832] inline-flex items-center text-sm font-medium"
            >
              Learn more
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Guide Section */}
        <div className="bg-[#0E5C3F]/5 rounded-2xl p-8 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <BookOpen className="h-16 w-16 text-[#0E5C3F] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              New to Boma Bora?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Check out our comprehensive guide to learn how to use all features effectively
            </p>
            <Link
              to="/guide"
              className="bg-[#0E5C3F] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0b4832] transition-colors inline-flex items-center justify-center"
            >
              View User Guide
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#6A3C1F] rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to modernize your dairy operations?
          </h2>
          <p className="text-lg text-brown-100 mb-8">
            Join Boma Bora today and experience seamless milk collection management
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-[#D4A853] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#c29743] transition-colors"
            >
              Sign Up Now
            </Link>
            <Link
              to="/login"
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/30"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;