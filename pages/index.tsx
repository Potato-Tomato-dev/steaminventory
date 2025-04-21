import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"

export default function Home() {
  return (
    <>
      <Head>
        <title>Tengri-Skins | CS:GO Skins Marketplace</title>
        <meta
          name="description"
          content="The premier marketplace for CS:GO skins with over 100,000 items and the best prices."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black to-red-950">
        {/* Header */}
        <header className="bg-black/80 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-8">
              <div className="font-bold text-xl">
                <span className="text-yellow-500">TENGRI</span>-SKINS
              </div>
              <nav className="hidden md:flex gap-6">
                <Link href="#" className="hover:text-yellow-500">
                  HOME
                </Link>
                <Link href="/trade" className="hover:text-yellow-500">
                  TRADE
                </Link>
                <Link href="#" className="hover:text-yellow-500">
                  MARKETPLACE
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-yellow-500 text-black px-4 py-2 rounded font-medium">SIGN UP</button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-r from-black to-red-900">
          <div className="container mx-auto">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                <span className="text-yellow-500">TENGRI</span>-SKINS
              </h1>
              <p className="text-gray-300 mb-8 text-lg">
                Welcome to Tengri CS:GO skins and marketplace - a top spot for CS:GO fans to buy skins and items at the
                best prices. With over 100,000 skins in our inventory...
              </p>
              <p className="text-gray-300 mb-8">
                Explore CS:GO skins from popular collections and discover rare items at competitive prices. With over
                500,000+ items in 250+ collections and 10,000+ daily trades.
              </p>
              <button className="bg-yellow-500 text-black px-6 py-3 rounded font-medium hover:bg-yellow-400 transition">
                EXPLORE SKINS
              </button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-1/3 h-full hidden lg:block">
            <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-l from-transparent to-red-900/90"></div>
            <Image
              src="/placeholder.svg?height=600&width=400"
              alt="CS:GO Weapon"
              width={400}
              height={600}
              className="object-contain object-bottom h-full"
            />
          </div>
        </section>

        {/* Featured Collections */}
        <section className="py-12 px-4 bg-red-950/80">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-lg overflow-hidden col-span-2">
                <div className="p-6 flex flex-col h-full">
                  <h3 className="text-red-400 text-sm mb-2">TENGRI PICKS</h3>
                  <h2 className="text-white text-2xl font-bold mb-4">Collection of New Inventory 2025</h2>
                  <p className="text-gray-300 mb-6">
                    Explore our latest additions with exclusive deals on premium skins
                  </p>
                  <div className="mt-auto">
                    <button className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2">
                      View More <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg overflow-hidden">
                <div className="p-6 flex flex-col h-full">
                  <h3 className="text-blue-400 text-sm mb-2">TENGRI EXCLUSIVE</h3>
                  <h2 className="text-white text-2xl font-bold mb-4">Premium Knife Collection</h2>
                  <p className="text-gray-300 mb-6">Rare knives with unique patterns and finishes</p>
                  <div className="mt-auto">
                    <button className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                      View More <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Rated Skins */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-white text-3xl font-bold mb-8">Discover the best deals on top-rated skins!</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "AK-47 | Asiimov", price: "$45.99", image: "" },
                { name: "M4A4 | Neo-Noir", price: "$32.50", image: "" },
                { name: "Gloves | Fade", price: "$189.99", image: "" },
                { name: "AWP | Wildfire", price: "$65.00", image: "" },
              ].map((item, index) => (
                <div key={index} className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden">
                  <div className="h-40 bg-gray-700 relative">
                    <Image src={item.image || ""} alt={item.name} fill className="object-contain p-2" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-yellow-500 font-bold">{item.price}</span>
                      <button className="bg-red-700 hover:bg-red-600 text-white text-xs px-2 py-1 rounded">
                        BUY NOW
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Streaming */}
        <section className="py-12 px-4 bg-red-950/70">
          <div className="container mx-auto">
            <h2 className="text-white text-3xl font-bold mb-8">Live Streaming</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                {[
                  { name: "AK-47 | Redline", image: "/placeholder.svg?height=150&width=300" },
                  { name: "Desert Eagle | Code Red", image: "/placeholder.svg?height=150&width=300" },
                  { name: "M4A1-S | Printstream", image: "/placeholder.svg?height=150&width=300", highlight: true },
                  { name: "Butterfly Knife | Fade", image: "/placeholder.svg?height=150&width=300" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`${item.highlight ? "bg-gradient-to-r from-red-800 to-red-700" : "bg-gradient-to-b from-gray-800 to-gray-900"} rounded-lg overflow-hidden`}
                  >
                    <div className="h-32 bg-gray-700 relative">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-red-800 to-red-700 rounded-lg overflow-hidden">
                <div className="p-6 flex flex-col h-full">
                  <div className="bg-red-900/50 p-4 rounded-lg mb-4">
                    <p className="text-white text-sm">
                      "Just got an amazing deal on an AWP | Dragon Lore. The transaction was smooth and the skin was
                      exactly as described. Tengri-Skins is now my go-to marketplace for all my CS:GO needs!"
                    </p>
                  </div>
                  <div className="mt-auto">
                    <button className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded w-full">
                      View More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-white text-3xl font-bold mb-8 text-center">Trusted by Thousands of Happy Customers</h2>
            <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">
              Our reputation speaks for itself with thousands of positive reviews and returning customers
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden">
                      <Image src="/placeholder.svg?height=40&width=40" alt="User" width={40} height={40} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">User Name</h3>
                      <div className="flex">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    "Great service and amazing selection of skins. The prices are competitive and the delivery is
                    instant. Highly recommended!"
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`w-2 h-2 rounded-full ${dot === 1 ? "bg-yellow-500" : "bg-gray-600"}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trusted Partner */}
        <section className="py-12 px-4 bg-red-950/70">
          <div className="container mx-auto">
            <h2 className="text-white text-3xl font-bold mb-4 text-center">We're the trusted partner for big names</h2>
            <p className="text-gray-400 text-center mb-10">Discover the difference our expertise makes.</p>
            <div className="flex justify-center gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="w-32 h-16 relative">
                  <Image
                    src="/placeholder.svg?height=64&width=128"
                    alt="Partner logo"
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-white text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
              {[
                "What is Tengri-Skins?",
                "How do I purchase skins?",
                "Are the trades secure?",
                "What payment methods do you accept?",
              ].map((question, index) => (
                <div key={index} className="border-b border-gray-700 py-4">
                  <button className="flex justify-between items-center w-full text-left text-white font-medium">
                    {question}
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 px-4 bg-gradient-to-r from-red-900 to-red-800">
          <div className="container mx-auto">
            <h2 className="text-white text-3xl font-bold mb-4 text-center">Get More Updates</h2>
            <p className="text-gray-300 text-center mb-8 max-w-xl mx-auto">
              Sign up to stay updated with the latest news and exclusive offers from Tengri-Skins
            </p>
            <div className="flex max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow bg-red-950/50 text-white border border-red-700 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-r font-medium">
                SUBSCRIBE
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gradient-to-b from-red-950 to-black text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-xl mb-4">
                  <span className="text-yellow-500">TENGRI</span>-SKINS
                </h3>
                <p className="text-gray-400 mb-4">
                  The premier marketplace for CS:GO skins with over 100,000 items and the best prices.
                </p>
                <div className="flex gap-4">
                  {["facebook", "twitter", "instagram", "discord"].map((social) => (
                    <a key={social} href="#" className="text-gray-400 hover:text-white">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="sr-only">{social}</span>
                        <div className="w-4 h-4"></div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-4">Marketplace</h3>
                <ul className="space-y-2">
                  {["All Skins", "Knives", "Gloves", "Rifles"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-gray-400 hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Help & Support</h3>
                <ul className="space-y-2">
                  {["FAQ", "Contact Us", "Terms of Service", "Privacy Policy"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-gray-400 hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
              <p>© 2025 Tengri-Skins | All Rights Reserved</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
