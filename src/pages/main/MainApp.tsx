import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Check } from './Check';
import { Settings } from './Settings';
import { Account } from './Account';
import { Subscription } from './Subscription';

export function MainApp() {
  const { activeTab } = useAppContext();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'check':
        return <Check />;
      case 'settings':
        return <Settings />;
      case 'account':
        return <Account />;
      case 'subscription':
        return <Subscription />;
      default:
        return <Check />;
    }
  };

  return (
    <div className="app-content">
      {renderActiveTab()}
    </div>
  );
}

