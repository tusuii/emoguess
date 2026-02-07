// Single component app - list + form (minimal design)
import { useState, useEffect } from 'react';
import { getItems, createItem } from './api';
import './App.css';

function App() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        price: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch items on mount
    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getItems();
            setItems(data);
        } catch (err) {
            setError('Failed to load items: ' + err.message);
            console.error('Error fetching items:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim()) {
            alert('Name is required');
            return;
        }
        if (formData.quantity === '' || formData.quantity < 0) {
            alert('Valid quantity is required');
            return;
        }
        if (formData.price === '' || formData.price < 0) {
            alert('Valid price is required');
            return;
        }

        try {
            setSubmitting(true);
            await createItem({
                name: formData.name.trim(),
                quantity: parseInt(formData.quantity),
                price: parseFloat(formData.price)
            });

            // Reset form
            setFormData({ name: '', quantity: '', price: '' });

            // Refresh list
            await fetchItems();

            alert('Item added successfully!');
        } catch (err) {
            alert('Failed to add item: ' + err.message);
            console.error('Error creating item:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Inventory Management</h1>
                <p>Simple 2-tier app for DevOps demo</p>
            </header>

            {/* Add Item Form */}
            <section className="form-section">
                <h2>Add New Item</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter item name"
                            disabled={submitting}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="quantity">Quantity:</label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            placeholder="Enter quantity"
                            min="0"
                            disabled={submitting}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="price">Price:</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="Enter price"
                            min="0"
                            step="0.01"
                            disabled={submitting}
                            required
                        />
                    </div>
                    <button type="submit" disabled={submitting}>
                        {submitting ? 'Adding...' : 'Add Item'}
                    </button>
                </form>
            </section>

            {/* Items List */}
            <section className="list-section">
                <h2>Items List</h2>

                {loading && <p className="loading">Loading items...</p>}

                {error && <p className="error">{error}</p>}

                {!loading && !error && items.length === 0 && (
                    <p className="empty">No items found. Add one above!</p>
                )}

                {!loading && !error && items.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Quantity</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>${parseFloat(item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

export default App;
