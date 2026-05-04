pipeline {
    agent any
    
    environment {
        AWS_REGION = 'ap-south-1'
        ECR_ACCOUNT = '475790160954'
        BACKEND_EC2_ID = 'i-0aba37cc978373707'
        // Secret names in AWS Secrets Manager
        DB_SECRET_NAME = 'capstone-db-secret'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/itschiku/capstone-project.git'
            }
        }
        
        stage('Fetch Database Secrets') {
            steps {
                script {
                    // Fetch the secret from AWS Secrets Manager
                    def secretJson = sh(
                        script: "aws secretsmanager get-secret-value --secret-id ${DB_SECRET_NAME} --region ${AWS_REGION} --query SecretString --output text",
                        returnStdout: true
                    ).trim()
                    
                    // Parse JSON using Python (since jq may not be installed)
                    DB_HOST = sh(
                        script: "echo '${secretJson}' | python3 -c \"import sys, json; print(json.load(sys.stdin)['host'])\"",
                        returnStdout: true
                    ).trim()
                    
                    DB_USER = sh(
                        script: "echo '${secretJson}' | python3 -c \"import sys, json; print(json.load(sys.stdin)['username'])\"",
                        returnStdout: true
                    ).trim()
                    
                    DB_PASSWORD = sh(
                        script: "echo '${secretJson}' | python3 -c \"import sys, json; print(json.load(sys.stdin)['password'])\"",
                        returnStdout: true
                    ).trim()
                    
                    DB_NAME = sh(
                        script: "echo '${secretJson}' | python3 -c \"import sys, json; print(json.load(sys.stdin)['dbname'])\"",
                        returnStdout: true
                    ).trim()
                    
                    DB_PORT = sh(
                        script: "echo '${secretJson}' | python3 -c \"import sys, json; print(json.load(sys.stdin)['port'])\"",
                        returnStdout: true
                    ).trim()
                    
                    echo "✅ Database secrets fetched successfully from Secrets Manager"
                }
            }
        }
        
        stage('Login to ECR') {
            steps {
                script {
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                }
            }
        }
        
        stage('Build FastAPI') {
            steps {
                script {
                    dir('backend/fastapi') {
                        sh "docker build -t ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:latest ."
                        sh "docker tag ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:latest ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:build-${BUILD_NUMBER}"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:latest"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:build-${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Build Node.js') {
            steps {
                script {
                    dir('backend/nodejs') {
                        sh "docker build -t ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:latest ."
                        sh "docker tag ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:latest ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:build-${BUILD_NUMBER}"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:latest"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:build-${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Build Spring Boot') {
            steps {
                script {
                    dir('backend/springboot') {
                        sh "docker build -t ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:latest ."
                        sh "docker tag ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:latest ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:build-${BUILD_NUMBER}"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:latest"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:build-${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Build .NET') {
            steps {
                script {
                    dir('backend/dotnet') {
                        sh "docker build -t ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:latest ."
                        sh "docker tag ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:latest ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:build-${BUILD_NUMBER}"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:latest"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:build-${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Deploy to Private EC2') {
            steps {
                script {
                    // Create .env file on EC2 with secrets from Secrets Manager
                    sh """
                        aws ssm send-command \
                            --instance-ids ${BACKEND_EC2_ID} \
                            --region ${AWS_REGION} \
                            --document-name "AWS-RunShellScript" \
                            --parameters 'commands=[
                                "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com",
                                "cd /home/ssm-user/capstone-project",
                                "git pull origin main",
                                "cd backend",
                                "cat > .env << 'ENV_FILE'
                                DB_HOST=${DB_HOST}
                                DB_PORT=${DB_PORT}
                                DB_NAME=${DB_NAME}
                                DB_USER=${DB_USER}
                                DB_PASSWORD=${DB_PASSWORD}
                                FASTAPI_PORT=8000
                                NODEJS_PORT=5000
                                SPRINGBOOT_PORT=8081
                                DOTNET_PORT=7000
                                ENV_FILE",
                                "cat .env",
                                "docker-compose pull",
                                "docker-compose up -d",
                                "docker system prune -f"
                            ]' \
                            --comment "Deploy from Jenkins Build ${BUILD_NUMBER}"
                    """
                }
            }
        }
        
        stage('Verify') {
            steps {
                script {
                    sh """
                        aws ssm send-command \
                            --instance-ids ${BACKEND_EC2_ID} \
                            --region ${AWS_REGION} \
                            --document-name "AWS-RunShellScript" \
                            --parameters 'commands=[
                                "echo '=== Container Status ==='",
                                "docker ps --format 'table {{.Names}}\\\\t{{.Status}}'",
                                "echo '=== Testing FastAPI ==='",
                                "curl -s http://localhost:8000/health || echo 'FastAPI not responding'"
                            ]'
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo '🎉 Build and deployment successful!'
            echo "📦 Images pushed with build number: ${BUILD_NUMBER}"
            echo "🔐 Database credentials sourced from AWS Secrets Manager"
        }
        failure {
            echo '❌ Build or deployment failed!'
            echo 'Check Jenkins console for details.'
        }
    }
}