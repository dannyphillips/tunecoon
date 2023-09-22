import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document<{
  styleTags: any;
}> {
  static async getInitialProps({ renderPage }) {
    const sheet = new ServerStyleSheet();
    const page = await renderPage(
      // eslint-disable-next-line react/display-name
      (App) => (props: any) =>
        sheet.collectStyles(<App {...props} />)
    );
    return {
      ...page,
      styleTags: <>{sheet.getStyleElement()}</>
    };
  }

  render() {
    const { styleTags } = this.props;

    return (
      <Html lang="en">
        <Head>{styleTags}</Head>
        <body>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
