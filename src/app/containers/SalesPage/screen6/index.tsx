import React, { useState } from 'react';
import styled, { css } from 'styled-components/macro';
import SalesButton from '../../../components/SalesButton';
import { useDispatch, useSelector } from 'react-redux';
import BackButton from '../BackButton';

import { actions } from '../slice';
import { selectSalesPage } from '../selectors';
import {
  isAddress,
  toChecksumAddress,
  validateEmail,
} from '../../../../utils/helpers';
import { useAccount } from '../../../hooks/useAccount';

const StyledContent = styled.div`
  background: var(--sales-background);
  max-width: 1200px;
  min-height: 620px;
  margin: 40px auto;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  padding: 40px 15px;
  .content-header {
    font-size: 28px;
    text-align: center;
  }
  a {
    margin-top: 110px;
    color: var(--gold);
    font-weight: normal;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 40px;
    label {
      font-size: 14px;
    }
  }
`;

const StyledInput = styled.input.attrs(_ => ({ type: 'text' }))`
  border: 1px solid #707070;
  background: #f4f4f4;
  border-radius: 8px;
  height: 40px;
  width: 289px;
  text-align: left;
  color: black;
  padding: 0 10px;
`;

const StyledTextArea = styled.textarea`
  border: 1px solid #707070;
  background: #f4f4f4;
  border-radius: 8px;
  height: 100px;
  color: black;
  padding: 10px;
`;

interface StyledProps {
  active: boolean;
}
const StyledButtonGroup = styled.div`
  background: rgba(254, 192, 4, 0.05);
  color: var(--gold);
  min-width: 120px;
  height: 48px;
  line-height: 48px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid var(--gold);
  text-align: center;
  cursor: pointer;
  ${(props: StyledProps) =>
    props.active &&
    css`
      background: var(--gold) !important;
      color: black !important;
    `}
`;

export default function Screen6() {
  const dispatch = useDispatch();
  const account = useAccount();
  const [amount, setAmount] = useState('0.03');
  const [address, setAddress] = useState(account);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [note, setNote] = useState('');

  const { requestAccessLoading, requestAccessError } = useSelector(
    selectSalesPage,
  );

  const submitCode = () => {
    dispatch(
      actions.requestAccess({
        address: address.toLowerCase(),
        email,
        discord: username,
        amount,
        comment: note,
      }),
    );
  };

  const addressValid = isAddress(toChecksumAddress(address));
  const emailValid = validateEmail(email);
  const valid = addressValid && !!address && !!email && emailValid;

  return (
    <StyledContent>
      <div className="d-flex flex-row">
        <BackButton />
      </div>
      <p className="content-header">
        Please fill out this form to request access to the
        <br />
        SOV* Genesis sale{' '}
      </p>
      <div className="row">
        <div className="col-md-6 d-flex flex-column align-items-center">
          <div className="form-group">
            <label htmlFor="address">Wallet to receive access</label>
            <StyledInput
              name="address"
              id="address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
            {address.length > 1 && !addressValid && (
              <small className="text-muted">
                Enter valid RSK wallet address.
              </small>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="email">Enter email</label>
            <StyledInput
              name="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {!!email && !emailValid && (
              <small className="text-muted">Enter valid email address.</small>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="username">Enter discord username (optional)</label>
            <StyledInput
              name="username"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div style={{ paddingRight: '150px' }}>
            <p>Select limit required</p>
            <div className="d-flex justify-content-between mb-5">
              <StyledButtonGroup
                active={amount === '0.03'}
                onClick={() => setAmount('0.03')}
              >
                0.03BTC
              </StyledButtonGroup>
              <StyledButtonGroup
                active={amount === '0.1'}
                onClick={() => setAmount('0.1')}
              >
                0.1BTC
              </StyledButtonGroup>
              <StyledButtonGroup
                active={amount === '2.0'}
                onClick={() => setAmount('2.0')}
              >
                2.0BTC
              </StyledButtonGroup>
            </div>

            <div className="form-group">
              <label htmlFor="note" className="ml-1">
                In a few words please explain why you should be chosen to
                receive a higher limit of SOV, and what interests you about
                being vested in the SOVRYN system
              </label>
              <StyledTextArea
                name="note"
                id="note"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {requestAccessError && (
        <div className="text-danger">{requestAccessError}</div>
      )}

      <SalesButton
        text={'Submit for Access'}
        onClick={submitCode}
        loading={requestAccessLoading}
        disabled={requestAccessLoading || !valid}
      />
    </StyledContent>
  );
}
