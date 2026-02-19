import { supabase } from './supabaseService';

/**
 * Booking Service - Handles all booking-related operations
 */

// Create a new booking
export const createBooking = async (bookingData) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .insert([
                {
                    customer_name: bookingData.customerName,
                    customer_email: bookingData.customerEmail,
                    customer_phone: bookingData.customerPhone,
                    agent_id: bookingData.agentId,
                    service_id: bookingData.serviceId,
                    booking_date: bookingData.bookingDate,
                    booking_time: bookingData.bookingTime,
                    status: bookingData.status || 'pending',
                    notes: bookingData.notes || '',
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
    }
};

// Get bookings for agent
export const getAgentBookings = async (agentId, status = null) => {
    try {
        let query = supabase
            .from('bookings')
            .select('*')
            .eq('agent_id', agentId);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('booking_date', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching agent bookings:', error);
        return { success: false, error: error.message };
    }
};

// Get all bookings for user
export const getUserBookings = async (userId) => {
    try {
        // Get user's agents first
        const { data: agents, error: agentsError } = await supabase
            .from('agents')
            .select('id')
            .eq('user_id', userId);

        if (agentsError) throw agentsError;

        const agentIds = agents.map(a => a.id);

        if (agentIds.length === 0) {
            return { success: true, data: [] };
        }

        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .in('agent_id', agentIds)
            .order('booking_date', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return { success: false, error: error.message };
    }
};

// Get booking by ID
export const getBooking = async (bookingId) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching booking:', error);
        return { success: false, error: error.message };
    }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', bookingId)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating booking status:', error);
        return { success: false, error: error.message };
    }
};

// Update booking
export const updateBooking = async (bookingId, bookingData) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({
                customer_name: bookingData.customerName,
                customer_email: bookingData.customerEmail,
                customer_phone: bookingData.customerPhone,
                booking_date: bookingData.bookingDate,
                booking_time: bookingData.bookingTime,
                notes: bookingData.notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating booking:', error);
        return { success: false, error: error.message };
    }
};

// Delete booking
export const deleteBooking = async (bookingId) => {
    try {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting booking:', error);
        return { success: false, error: error.message };
    }
};

// Get booking statistics for agent
export const getBookingStats = async (agentId, days = 30) => {
    try {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        const { data, error } = await supabase
            .from('bookings')
            .select('status')
            .eq('agent_id', agentId)
            .gte('created_at', dateFrom.toISOString());

        if (error) throw error;

        const stats = {
            total: data.length,
            pending: data.filter(b => b.status === 'pending').length,
            confirmed: data.filter(b => b.status === 'confirmed').length,
            completed: data.filter(b => b.status === 'completed').length,
            cancelled: data.filter(b => b.status === 'cancelled').length
        };

        return { success: true, stats };
    } catch (error) {
        console.error('Error fetching booking stats:', error);
        return { success: false, error: error.message };
    }
};

export default {
    createBooking,
    getAgentBookings,
    getUserBookings,
    getBooking,
    updateBookingStatus,
    updateBooking,
    deleteBooking,
    getBookingStats
};
