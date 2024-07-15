import React, { useContext, useEffect } from 'react';
import {useNavigate} from 'react-router-dom';

import { AuthContext } from '../App';
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';

// Styling
import './AccountPage.scss';

export default function AccountPage() {
  const { authContext } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (authContext.loginStateKnown && !authContext.username) {
      navigate('/');
    }
  }, [authContext]);

  return (
    <div className="account-page">
      <PageHeader
        title="My Account"
        description="">
      </PageHeader>
      <Footer />
    </div>
  );
}
