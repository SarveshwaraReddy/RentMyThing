import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import itemsService from "../services/items.js";
import ItemCard from "../components/ItemCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const categories = [
  "All",
  "Electronics",
  "Tools",
  "Textbooks",
  "Bicycles & Scooters",
  "Clothing",
  "Sports Gear",
  "Other",
];

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Geolocation states (Phase 7 support)
  const [useLocation, setUseLocation] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [maxDistance, setMaxDistance] = useState(10); // default 10 km
  const [detectingLocation, setDetectingLocation] = useState(false);

  const { isAuthenticated } = useAuth();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      
      // Text search
      if (search.trim()) {
        params.search = search;
      }
      
      // Category filter
      if (selectedCategory !== "All") {
        params.category = selectedCategory;
      }

      // Geolocation query parameters
      if (useLocation && latitude && longitude) {
        params.lat = latitude;
        params.lng = longitude;
        params.maxDistance = maxDistance * 1000; // Convert km to meters
      }

      const response = await itemsService.getItems(params);
      let fetchedItems = response.data.data;

      // Apply sorting on client if not using near location sort
      if (!(useLocation && latitude && longitude)) {
        if (sortBy === "price_asc") {
          fetchedItems.sort((a, b) => a.dailyRate - b.dailyRate);
        } else if (sortBy === "price_desc") {
          fetchedItems.sort((a, b) => b.dailyRate - a.dailyRate);
        }
      }

      setItems(fetchedItems);
    } catch (error) {
      console.error("Error loading marketplace listings:", error);
      toast.error("Failed to load listings. Please reload.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [selectedCategory, sortBy, useLocation, latitude, longitude, maxDistance]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  // Toggle geolocation usage
  const handleLocationToggle = () => {
    if (!useLocation) {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser.");
        return;
      }

      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setUseLocation(true);
          setDetectingLocation(false);
          toast.success("Location acquired. Showing nearby items.");
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Failed to get location. Ensure permissions are enabled.");
          setDetectingLocation(false);
        }
      );
    } else {
      setUseLocation(false);
      setLatitude(null);
      setLongitude(null);
    }
  };

  return (
    <div className="marketplace-page page">
      {/* Top Banner section */}
      <section className="marketplace-hero">
        <div className="hero-text">
          <h1>Campus Marketplace</h1>
          <p>Find what you need, rent out what you own. Fast, local, and secure.</p>
        </div>
        {isAuthenticated && (
          <Link to="/items/new" className="btn btn-primary btn-add-listing">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              className="icon-plus"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            List an Item
          </Link>
        )}
      </section>

      {/* Filter and search bar controls */}
      <section className="search-filter-section">
        <form onSubmit={handleSearchSubmit} className="search-bar-form">
          <div className="search-input-wrapper">
            <svg
              className="icon-search"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search items by title or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control search-input"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-search">
            Search
          </button>
        </form>

        <div className="discovery-controls">
          {/* Geospatial filter toggler */}
          <div className="location-filter-control">
            <button
              type="button"
              onClick={handleLocationToggle}
              className={`btn btn-location-toggle ${useLocation ? "active" : ""}`}
              disabled={detectingLocation}
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                className="icon-location"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {detectingLocation ? "Acquiring GPS..." : useLocation ? "Nearby Search: ON" : "Find Nearby"}
            </button>

            {useLocation && (
              <div className="distance-slider-wrapper">
                <span>Range: <strong>{maxDistance} km</strong></span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className="distance-slider"
                />
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="sort-control">
            <label>
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-control sort-select"
                disabled={useLocation} // location uses proximity sorting automatically
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Category Selection Tabs */}
      <nav className="categories-tab-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-tab-btn ${selectedCategory === cat ? "active" : ""}`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Item Feed Grid */}
      {loading ? (
        <div className="marketplace-loading-state">
          <div className="shimmer-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="shimmer-card">
                <div className="shimmer-img"></div>
                <div className="shimmer-line title"></div>
                <div className="shimmer-line text"></div>
                <div className="shimmer-line btn"></div>
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="marketplace-empty-state">
          <svg
            className="icon-empty"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="48"
            height="48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3>No items found</h3>
          <p>We couldn't find any listings matching your filters. Try checking other categories or listing one yourself!</p>
          {isAuthenticated && (
            <Link to="/items/new" className="btn btn-primary">
              List a New Item
            </Link>
          )}
        </div>
      ) : (
        <motion.div
          className="items-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Marketplace;
