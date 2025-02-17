import React from 'react';
import styled from 'styled-components/macro';
import LogoCircle from '../../../assets/images/logoCircle.svg';
import { media } from '../../../styles/media';

const StyledHeader = styled.div.attrs(_ => ({
  className:
    'd-flex flex-column flex-md-row align-items-center justify-content-center',
}))`
  justify-content: center;
  margin-bottom: 1.8em;
  margin-top: 1.3rem;
  img {
    width: 30px;
    margin-bottom: 25px;
  }
  ${media.md`
  justify-content: center;
  img {
    width: 52px;
    margin-bottom: 0px;
    margin-right: 25px;
  }
  `}
`;

const H1 = styled.h1`
  font-size: 24px;
  font-family: 'Montserrat';
  text-align: center;
  font-weight: bold;
  letter-spacing: 0.8rem !important;
  margin: 0;
  ${media.md`font-size: 53px; text-align: left;`}
`;

export default function PageHeader() {
  return (
    <StyledHeader>
      <img src={LogoCircle} alt="SOV" />
      <H1>SOV* GENESIS SALE</H1>
    </StyledHeader>
  );
}
