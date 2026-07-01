import { HireTechnologyConfig } from "@/types/hire-technology";

export const devopsConfig: HireTechnologyConfig = {
  id: "devops",
  name: "DevOps",
  heroHeadline: "Hire Top DevOps Engineers",
  heroSubheadline: "Automate, scale, and secure your infrastructure for faster, more reliable software delivery.",
  heroDescription: "Our DevOps engineers bridge the gap between development and operations. We implement robust CI/CD pipelines, orchestrate containerized environments, and establish Infrastructure as Code (IaC) to ensure your software is deployed rapidly, securely, and with maximum uptime.",
  aboutContent: `
## Why You Need Dedicated DevOps Engineering

In the modern software development lifecycle, the speed of delivery must be matched by stability and security. DevOps is not just a role; it's a culture and a set of practices that automates and integrates the processes between software development and IT teams. When you hire DevOps engineers from us, you are investing in the foundation of your technological agility. They eliminate bottlenecks, reduce manual errors, and ensure that your development team can focus on writing code rather than wrestling with server configurations.

A core tenet of our DevOps methodology is Continuous Integration and Continuous Deployment (CI/CD). Our engineers design and implement automated pipelines using tools like Jenkins, GitLab CI, GitHub Actions, or CircleCI. This automation ensures that every code change is rigorously tested, built, and deployed to staging or production environments predictably and safely. This drastically reduces the time-to-market for new features and bug fixes, allowing you to respond to customer needs faster than your competitors.

### Infrastructure as Code (IaC) and Scalability

Gone are the days of manually provisioning servers. Our DevOps experts utilize Infrastructure as Code (IaC) tools such as Terraform, AWS CloudFormation, or Ansible to define and manage your infrastructure through code. This approach ensures that your environments are reproducible, consistent, and version-controlled. If a disaster occurs, or if you need to spin up a new environment for testing, IaC allows you to do so in minutes rather than days.

Furthermore, we specialize in containerization and orchestration using Docker and Kubernetes. By packaging applications into isolated containers, we guarantee that software runs consistently regardless of the environment. Kubernetes allows us to orchestrate these containers at scale, automatically managing deployment, scaling, and load balancing. This ensures your application remains highly available and performant, even during unexpected traffic spikes.

### Security and Cloud Cost Optimization

Security is integrated into every step of our DevOps process—a practice often referred to as DevSecOps. We implement automated security scanning in the CI/CD pipeline to catch vulnerabilities early in the development cycle. We configure secure network architectures, manage access controls (IAM), and ensure compliance with industry standards, protecting your valuable data and reputation.

In addition to security, our DevOps engineers are highly skilled in cloud cost optimization. We analyze your AWS, Azure, or Google Cloud (GCP) infrastructure to identify underutilized resources, recommend appropriate instance types, and implement auto-scaling policies. We ensure that you are only paying for the compute power you actually need, often resulting in significant reductions in your monthly cloud expenditures.
  `,
  benefits: [
    {
      title: "Faster Time to Market",
      description: "Accelerate software delivery with automated CI/CD pipelines, allowing for frequent and reliable releases of features and bug fixes.",
      icon: "clock"
    },
    {
      title: "Enhanced Reliability",
      description: "Minimize downtime and system failures through robust infrastructure architecture, automated testing, and continuous monitoring.",
      icon: "shield"
    },
    {
      title: "Scalable Infrastructure",
      description: "Utilize container orchestration (Kubernetes) and cloud-native services to build systems that automatically scale with user demand.",
      icon: "trending-up"
    },
    {
      title: "Cost Optimization",
      description: "Reduce unnecessary cloud spending through intelligent resource allocation, auto-scaling, and regular infrastructure audits.",
      icon: "dollar-sign"
    },
    {
      title: "Improved Security",
      description: "Embed security checks directly into the deployment pipeline (DevSecOps) and enforce strict access controls across all environments.",
      icon: "lock"
    }
  ],
  process: [
    {
      title: "Infrastructure Audit & Strategy",
      description: "We begin by assessing your current infrastructure, deployment processes, and pain points. We then design a comprehensive DevOps roadmap aligned with your business objectives.",
      icon: "search"
    },
    {
      title: "Engineer Onboarding",
      description: "We assign dedicated DevOps experts proficient in your specific cloud provider (AWS, GCP, Azure) and preferred toolchain (Terraform, Kubernetes, Jenkins).",
      icon: "user-plus"
    },
    {
      title: "Pipeline Automation (CI/CD)",
      description: "We build and optimize automated pipelines for testing, building, and deploying your application, ensuring smooth transitions from development to production.",
      icon: "refresh-cw"
    },
    {
      title: "Infrastructure as Code Implementation",
      description: "We codify your infrastructure using Terraform or similar tools, making your environments reproducible, version-controlled, and easily manageable.",
      icon: "code"
    },
    {
      title: "Monitoring & Continuous Optimization",
      description: "We implement robust monitoring and alerting systems (e.g., Datadog, Prometheus) to proactively manage system health and continuously optimize cloud costs.",
      icon: "activity"
    }
  ],
  pricing: {
    hourly: "$50 - $90",
    monthly: "$6,500 - $12,000",
    dedicated: "Custom Quote",
    description: "Pricing varies based on the complexity of your infrastructure, the cloud provider used, and the specific expertise (e.g., Kubernetes, Security) required."
  },
  faqs: [
    {
      question: "Which cloud providers do your DevOps engineers support?",
      answer: "Our DevOps engineers have deep expertise across all major cloud providers, including Amazon Web Services (AWS), Google Cloud Platform (GCP), and Microsoft Azure. We can also assist with hybrid or multi-cloud strategies if required."
    },
    {
      question: "What is Infrastructure as Code (IaC) and why do I need it?",
      answer: "IaC is the process of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools. You need it because it makes your infrastructure consistent, reproducible, version-controllable (like software code), and drastically reduces the risk of human error during manual setups."
    },
    {
      question: "Can you help migrate our legacy application to the cloud?",
      answer: "Yes. Cloud migration is a core competency. We handle the entire process: assessing the legacy architecture, containerizing the application using Docker, designing the target cloud architecture, and executing the migration with minimal to zero downtime."
    },
    {
      question: "How do you handle security in the DevOps process?",
      answer: "We practice DevSecOps, meaning security is integrated from the start. We implement automated vulnerability scanning in the CI/CD pipeline, enforce least-privilege access via IAM, configure secure VPCs and firewalls, and ensure secrets (API keys, passwords) are managed securely using tools like HashiCorp Vault or AWS Secrets Manager."
    },
    {
      question: "Do you offer 24/7 monitoring and support?",
      answer: "Yes, we can set up comprehensive monitoring and alerting systems (using Datadog, Prometheus/Grafana, etc.) and offer ongoing support contracts to ensure that any infrastructure issues are addressed immediately, minimizing potential downtime."
    }
  ],
  metaTitle: "Hire DevOps Engineers | Cloud, CI/CD & Kubernetes Experts",
  metaDescription: "Hire expert DevOps engineers to automate your software delivery, implement CI/CD, manage cloud infrastructure (AWS/GCP/Azure), and ensure maximum system reliability."
};
