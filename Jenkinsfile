pipeline {
    agent any
    
    environment {
        BACKEND_EC2_ID = 'i-0aba37cc978373707'
        AWS_REGION = 'ap-south-1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/itschiku/capstone-project.git'
            }
        }
        
        stage('Deploy to Backend EC2') {
            steps {
                script {
                    sh '''
                        aws ssm send-command \
                            --instance-ids i-0aba37cc978373707 \
                            --region ap-south-1 \
                            --document-name "AWS-RunShellScript" \
                            --parameters 'commands=[
                                "cd /home/ssm-user/capstone-project",
                                "git pull origin main",
                                "cd backend",
                                "docker-compose down",
                                "docker-compose build --no-cache",
                                "docker-compose up -d",
                                "docker system prune -f"
                            ]' \
                            --comment "Deploy from Jenkins"
                    '''
                }
            }
        }
        
        stage('Verify') {
            steps {
                script {
                    sh '''
                        aws ssm send-command \
                            --instance-ids i-0aba37cc978373707 \
                            --region ap-south-1 \
                            --document-name "AWS-RunShellScript" \
                            --parameters 'commands=["docker ps --format \\"table {{.Names}}\\t{{.Status}}\\""]'
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}
