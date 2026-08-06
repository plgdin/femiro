import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Check, Plus, Home, Building2, Tag } from 'lucide-react'
import type { Address } from '../types'

interface AddressDropdownProps {
  addresses: Address[]
  selectedId: string
  onSelect: (id: string) => void
  customAddr: string
  setCustomAddr: (val: string) => void
  onManageAddresses: () => void
}

export function AddressDropdown({
  addresses,
  selectedId,
  onSelect,
  customAddr,
  setCustomAddr,
  onManageAddresses
}: AddressDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedAddress = addresses.find(a => a.id === selectedId) || addresses[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Home':
        return <Home size={14} />
      case 'Office':
        return <Building2 size={14} />
      default:
        return <Tag size={14} />
    }
  }

  if (addresses.length === 0) {
    return (
      <div className="custom-address-container">
        <input
          type="text"
          placeholder="Enter shipping address manually"
          value={customAddr}
          onChange={e => setCustomAddr(e.target.value)}
          className="custom-address-field"
        />
        <button onClick={onManageAddresses} className="manage-address-btn" type="button">
          + Manage addresses in Account
        </button>
      </div>
    )
  }

  return (
    <div className="modern-address-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`modern-address-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="trigger-left-content">
          <div className="location-pin-badge">
            <MapPin size={16} />
          </div>
          {selectedAddress ? (
            <div className="selected-address-info">
              <div className="selected-address-header">
                <span className={`address-tag-pill tag-${selectedAddress.tag.toLowerCase()}`}>
                  {getTagIcon(selectedAddress.tag)}
                  {selectedAddress.tag}
                </span>
                <span className="selected-recipient-name">{selectedAddress.name}</span>
              </div>
              <span className="selected-address-street">
                {selectedAddress.street}, {selectedAddress.city} ({selectedAddress.pincode})
              </span>
            </div>
          ) : (
            <span className="placeholder-text">Select shipping address</span>
          )}
        </div>
        <ChevronDown size={18} className={`trigger-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="modern-address-menu">
          <div className="menu-header">Select Delivery Location</div>
          <div className="address-options-list">
            {addresses.map(addr => {
              const isSelected = addr.id === (selectedAddress?.id || selectedId)
              return (
                <div
                  key={addr.id}
                  className={`address-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(addr.id)
                    setIsOpen(false)
                  }}
                >
                  <div className="option-left">
                    <div className="option-tag-row">
                      <span className={`address-tag-pill tag-${addr.tag.toLowerCase()}`}>
                        {getTagIcon(addr.tag)}
                        {addr.tag}
                      </span>
                      {addr.isDefault && <span className="default-badge">Default</span>}
                      <b className="option-recipient">{addr.name}</b>
                    </div>
                    <div className="option-full-address">
                      {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                    </div>
                    <div className="option-mobile">📱 {addr.mobile}</div>
                  </div>
                  {isSelected && (
                    <div className="option-check-icon">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="menu-footer">
            <button
              type="button"
              className="manage-locations-action-btn"
              onClick={() => {
                setIsOpen(false)
                onManageAddresses()
              }}
            >
              <Plus size={15} /> Add or Manage Addresses
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
