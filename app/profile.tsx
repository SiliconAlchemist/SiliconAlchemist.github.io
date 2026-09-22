import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { site } from 'virtual:portfolio-content';

export function Profile({ open, onOpenChange, day }: {
  open: boolean; onOpenChange: (open: boolean) => void; day: boolean;
}) {
  const resume = site.links.find((link) => link.label === 'Résumé');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`project-dialog profile-dialog${day ? ' is-day' : ''}`} closeLabel="Close profile">
        <header className="profile-header">
          <img className="profile-portrait" src="/images/portrait-self.png" alt="Shrikant Garg" />
          <div>
            <p className="eyebrow">THE PERSON BEHIND THE ISLAND</p>
            <DialogTitle className="dialog-title">Shrikant Garg</DialogTitle>
            <DialogDescription className="dialog-description">Senior Data Systems Software Engineer</DialogDescription>
            <div className="profile-contact">
              <a href="mailto:shrikantgarg2@gmail.com">Email</a>
              <a href="https://github.com/SiliconAlchemist" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
              {resume && <a href={resume.url} target="_blank" rel="noopener noreferrer">Résumé ↗</a>}
            </div>
          </div>
        </header>
        <div className="project-story profile-story">
          <h2>Experience</h2>
          <h3>Oracle</h3>
          <p className="profile-role">Senior Data Systems Software Engineer<br />November 2024–Present · Bengaluru, Karnataka</p>
          <ul>
            <li>Engineered an anomaly detection system for infrastructure metrics processing <strong>25M+ observations each hour</strong> using statistical methods and custom-trained LSTM models.</li>
            <li>Built a natural-language data exploration platform using <strong>MCP integrations and RAG</strong>, enabling engineers and executives to investigate incidents and query cloud-service data.</li>
            <li>Designed a deterministic cloud risk engine including event calibration, metric anomalies, forecasts, and operational events to prioritize emerging faults and alert customers across <strong>three cloud services</strong>.</li>
            <li>Integrated autonomous coding agents into the APEX development workflow, enabling teammates to maintain and extend the platforms while reducing development and maintenance time by <strong>50%</strong>.</li>
          </ul>
          <h3>Walmart Global Tech</h3>
          <p className="profile-role">Software Engineer III<br />June 2022–November 2024 · Bengaluru, Karnataka</p>
          <ul>
            <li>Designed and implemented ETL workflows to integrate and transform <strong>8 TB of data daily</strong>.</li>
            <li>Rebuilt the data pipeline to ingest directly from Apache Kafka instead of multiple data stores, improving data freshness from <strong>2 days to 2 hours</strong> and reducing cloud costs by <strong>30%</strong>.</li>
            <li>Independently built a reporting platform, owning user journey mapping and implementation across the data, API, and frontend layers, and delivering the first release within <strong>two months</strong>.</li>
          </ul>
          <p className="dialog-note">Further details of professional work cannot be shared under confidentiality agreements with the respective organizations.</p>
          <h2>Selected projects & publication</h2>
          <h3>CHI Extended Abstracts · 2022</h3>
          <p>Garg, S., Srivastava, A., Glencross, M., & Sharma, O. <a href="https://doi.org/10.1145/3491101.3519678" target="_blank" rel="noopener noreferrer">A Study of the Effects of Network Latency on Visual Task Performance in Video Conferencing.</a></p>
          <h3>Curiosity-Driven Reinforcement Learning</h3>
          <p>Implemented curiosity-driven reinforcement learning in Python and PyTorch, integrating an Intrinsic Curiosity Module for visual exploration.</p>
          <h3>Classifier Selection for Stable Learned Bloom Filters</h3>
          <p>Developed guidelines for selecting classifiers for stable learned Bloom filters across different use cases using Python.</p>
          <h2>Education</h2>
          <h3>Indraprastha Institute of Information Technology Delhi</h3>
          <p>Bachelor of Technology in Computer Science and Design<br />2018–2022 · New Delhi, Delhi NCR<br /><strong>GPA: 8.35 / 10.00</strong></p>
          <p><strong>Relevant coursework:</strong> Machine Learning, Reinforcement Learning, Computer Graphics, Data Structures and Algorithms, Object-Oriented Programming, Analysis and Design of Algorithms, Linear Algebra, Probability and Statistics, Network Science, Database Management.</p>
          <h2>Technical skills</h2>
          <p><strong>Languages:</strong> Python, Java, C++, SQL, Scala, JavaScript, Bash</p>
          <p><strong>Frameworks & libraries:</strong> Spring Boot, Flask, React, Node.js, PyTorch, TensorFlow, scikit-learn, XGBoost, Hugging Face Transformers, pandas, NumPy, SciPy, Matplotlib, Seaborn</p>
          <p><strong>Data, cloud & infrastructure:</strong> Apache Spark, Apache Kafka, GCP, Docker, Kubernetes, Linux, Git, MLflow</p>
          <p><strong>AI & ML:</strong> Retrieval-Augmented Generation (RAG), Model Context Protocol (MCP), Reinforcement Learning, Time-Series Forecasting, Model Serving</p>
          <h2>Awards & achievements</h2>
          <ul>
            <li>First place at Walmart’s Organic Traffic Hackathon, receiving <strong>$5,000</strong> and sponsorship to build the proposed solution.</li>
            <li>Second place in the Paytm Build for India Hackathon.</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
