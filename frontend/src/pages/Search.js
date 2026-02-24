import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import api from '../config/api';
import './Search.css';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ users: [], assets: [] });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults({ users: [], assets: [] });
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const [usersResponse, assetsResponse] = await Promise.all([
          api.get('/users', { params: { search: trimmed } }),
          api.get('/assets', { params: { search: trimmed } })
        ]);

        setResults({
          users: (usersResponse.data || []).slice(0, 12),
          assets: (assetsResponse.data || []).slice(0, 12)
        });
      } catch (error) {
        setResults({ users: [], assets: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: trimmed });
  }, [query, setSearchParams]);

  const { users, assets } = results;
  const hasResults = users.length > 0 || assets.length > 0;

  return (
    <div className="search-page fade-in">
      <div className="search-shell">
        <div className="search-input-wrap">
          <FiSearch />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creators or assets"
            autoFocus
          />
        </div>

        {query.trim().length < 2 ? (
          <p className="search-hint">Type at least 2 characters to search.</p>
        ) : loading ? (
          <p className="search-hint">Searching...</p>
        ) : hasResults ? (
          <div className="search-groups">
            {users.length > 0 && (
              <section className="search-group">
                <h3>Creators</h3>
                {users.map((person) => (
                  <button
                    type="button"
                    key={person._id}
                    className="search-item"
                    onClick={() => navigate(`/connections?search=${encodeURIComponent(person.name)}`)}
                  >
                    <img src={person.avatar} alt={person.name} />
                    <span>{person.name}</span>
                  </button>
                ))}
              </section>
            )}

            {assets.length > 0 && (
              <section className="search-group">
                <h3>Assets</h3>
                {assets.map((asset) => (
                  <button
                    type="button"
                    key={asset._id}
                    className="search-item"
                    onClick={() => navigate(`/assets/${asset._id}`)}
                  >
                    <img
                      src={asset.media?.[0]?.url || 'https://via.placeholder.com/40'}
                      alt={asset.title}
                    />
                    <span>{asset.title}</span>
                  </button>
                ))}
              </section>
            )}
          </div>
        ) : (
          <p className="search-hint">No matching creators or assets.</p>
        )}
      </div>
    </div>
  );
};

export default Search;
