
import BlogHeader from "@/components/BlogHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Book, Users, Target, Award, Globe } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Nonce Firewall</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tech based educational blogs and multipurpose blogging arena
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At Nonce Firewall, we believe that knowledge should be accessible to everyone. Our mission is to create 
              a comprehensive educational platform that bridges the gap between complex technical concepts and 
              practical understanding. We strive to empower individuals and organizations with the knowledge they 
              need to navigate the ever-evolving digital landscape safely and effectively.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you're a cybersecurity professional, a tech enthusiast, or someone just beginning their 
              journey in the digital world, our platform provides valuable insights, practical guides, and 
              cutting-edge information to help you stay ahead of the curve.
            </p>
          </CardContent>
        </Card>

        {/* What We Offer */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Book className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Educational Content</h3>
              <p className="text-gray-600">
                In-depth tutorials, guides, and articles covering cybersecurity, technology trends, and best practices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Focus</h3>
              <p className="text-gray-600">
                Building a community of learners, professionals, and enthusiasts who share knowledge and experiences.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Practical Solutions</h3>
              <p className="text-gray-600">
                Real-world applications and solutions that you can implement immediately in your projects and workflows.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Our Values */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Award className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Quality First</h3>
                  <p className="text-gray-600">
                    We prioritize accuracy, depth, and relevance in all our content to ensure our readers receive 
                    the highest quality information.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Globe className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Accessibility</h3>
                  <p className="text-gray-600">
                    Making complex technical topics understandable and accessible to audiences of all skill levels 
                    and backgrounds.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Security Focused</h3>
                  <p className="text-gray-600">
                    Emphasizing security best practices and helping our community stay protected in the digital world.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Community Driven</h3>
                  <p className="text-gray-600">
                    Building and nurturing a supportive community where knowledge sharing and collaboration thrive.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-gray-600 mb-6">
              Have questions, suggestions, or want to contribute? We'd love to hear from you.
            </p>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong> noncefirewall@gmail.com
              </p>
              <p className="text-gray-600">
                We're always looking for passionate writers and contributors to join our community.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
