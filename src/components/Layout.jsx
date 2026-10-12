import Header from "./Header.jsx";

export default function Layout({ orgName, children }) {
  return (
    <div className="app">
      <Header orgName={orgName} />
      <main className="main">{children}</main>
    </div>
  );
}
