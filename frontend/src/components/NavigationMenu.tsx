import { Link } from 'react-router-dom';

export default function NavigationMenu() {

  return (
    <nav className="site-nav" aria-label="Primary navigation">

      <div>
        <header>
          <h1>Markr</h1>
        </header>
      </div>

      <div id="site-navigation" className='nav-links'>
        <Link to="/" >
          Upload
        </Link>
        <Link to="/tests" >
          Tests
        </Link>
      </div>
    </nav>
  );
}
