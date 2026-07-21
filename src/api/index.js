import { apiRequest } from './client'

export const adminLogin = (body) => apiRequest('/admin/login', { method: 'POST', body })
export const logout = () => apiRequest('/logout', { method: 'POST' })
export const fetchMe = () => apiRequest('/user')

export const fetchDashboard = () => apiRequest('/admin/dashboard')

export const fetchCategories = () => apiRequest('/admin/categories')
export const createCategory = (body) => apiRequest('/admin/categories', { method: 'POST', body })
export const updateCategory = (id, body) => apiRequest(`/admin/categories/${id}`, { method: 'PUT', body })
export const deleteCategory = (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' })

export const fetchMenuItems = (params = {}) => {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.category_id) q.set('category_id', params.category_id)
  if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') {
    q.set('is_active', params.is_active)
  }
  const qs = q.toString()
  return apiRequest(`/admin/menu-items${qs ? `?${qs}` : ''}`)
}
export const createMenuItem = (body) => apiRequest('/admin/menu-items', { method: 'POST', body })
export const updateMenuItem = (id, body) =>
  apiRequest(`/admin/menu-items/${id}`, {
    method: body instanceof FormData ? 'POST' : 'PUT',
    body,
  })
export const deleteMenuItem = (id) => apiRequest(`/admin/menu-items/${id}`, { method: 'DELETE' })

export const fetchOrders = (params = {}) => {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.status) q.set('status', params.status)
  if (params.statuses) q.set('statuses', params.statuses)
  const qs = q.toString()
  return apiRequest(`/admin/orders${qs ? `?${qs}` : ''}`)
}
export const fetchOrder = (id) => apiRequest(`/admin/orders/${id}`)
export const updateOrderStatus = (id, status) =>
  apiRequest(`/admin/orders/${id}/status`, { method: 'PUT', body: { status } })

export const fetchNotifications = () => apiRequest('/admin/notifications')
export const fetchUnreadNotificationCount = () =>
  apiRequest('/admin/notifications/unread-count')
export const markNotificationRead = (id) =>
  apiRequest(`/admin/notifications/${id}/read`, { method: 'PUT' })
export const markAllNotificationsRead = () =>
  apiRequest('/admin/notifications/read-all', { method: 'PUT' })

export const fetchMessages = () => apiRequest('/admin/messages')
export const deleteMessage = (id) => apiRequest(`/admin/messages/${id}`, { method: 'DELETE' })

export const fetchUsers = (params = {}) => {
  const q = new URLSearchParams()
  if (params.role) q.set('role', params.role)
  const qs = q.toString()
  return apiRequest(`/admin/users${qs ? `?${qs}` : ''}`)
}
