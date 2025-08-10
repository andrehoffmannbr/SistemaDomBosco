#!/bin/bash
# Script de teste da Edge Function create-user em produção
# Uso: ./test_edge_function.sh <JWT_ADMIN>

EDGE_URL="https://iyukvodgqagaedomwxcs.supabase.co/functions/v1/create-user"
JWT_ADMIN="$1"

if [ -z "$JWT_ADMIN" ]; then
    echo "❌ Erro: JWT do admin não fornecido"
    echo "Uso: $0 <JWT_ADMIN>"
    exit 1
fi

echo "🧪 INICIANDO TESTES DA EDGE FUNCTION create-user"
echo "================================================"

# Teste 1: Sem JWT (deve falhar)
echo -e "\n📋 TESTE 1: Sem JWT (deve retornar 401)"
echo "curl -i -X POST '$EDGE_URL' -H 'Content-Type: application/json' -d '{\"email\":\"sem_jwt@test.com\",\"password\":\"123456\",\"role\":\"admin\"}'"
RESULT1=$(curl -s -w "HTTPCODE:%{http_code}" -X POST "$EDGE_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"sem_jwt@test.com","password":"123456","role":"admin"}')
HTTP_CODE1=$(echo "$RESULT1" | grep -o "HTTPCODE:[0-9]*" | cut -d: -f2)
RESPONSE1=$(echo "$RESULT1" | sed 's/HTTPCODE:[0-9]*$//')

echo "Status: $HTTP_CODE1"
echo "Response: $RESPONSE1"
if [ "$HTTP_CODE1" = "401" ]; then
    echo "✅ PASSOU: 401 Unauthorized como esperado"
else
    echo "❌ FALHOU: Esperado 401, obtido $HTTP_CODE1"
fi

# Teste 2: JWT inválido (deve falhar)
echo -e "\n📋 TESTE 2: JWT inválido (deve retornar 401)"
INVALID_JWT="${JWT_ADMIN:0:50}INVALID${JWT_ADMIN:57}"
echo "curl -i -X POST '$EDGE_URL' -H 'Authorization: Bearer ***INVALID***' ..."
RESULT2=$(curl -s -w "HTTPCODE:%{http_code}" -X POST "$EDGE_URL" \
  -H "Authorization: Bearer $INVALID_JWT" \
  -H "Content-Type: application/json" \
  -d '{"email":"jwt_invalido@test.com","password":"123456","role":"admin"}')
HTTP_CODE2=$(echo "$RESULT2" | grep -o "HTTPCODE:[0-9]*" | cut -d: -f2)
RESPONSE2=$(echo "$RESULT2" | sed 's/HTTPCODE:[0-9]*$//')

echo "Status: $HTTP_CODE2"
echo "Response: $RESPONSE2"
if [ "$HTTP_CODE2" = "401" ]; then
    echo "✅ PASSOU: 401 Unauthorized como esperado"
else
    echo "❌ FALHOU: Esperado 401, obtido $HTTP_CODE2"
fi

# Teste 3: JWT válido de admin (deve funcionar)
echo -e "\n📋 TESTE 3: JWT válido de admin (deve retornar 200)"
TIMESTAMP=$(date +%s)
TEST_EMAIL="admin_test_$TIMESTAMP@dom.com"
echo "curl -i -X POST '$EDGE_URL' -H 'Authorization: Bearer ***REDACTED***' ..."
RESULT3=$(curl -s -w "HTTPCODE:%{http_code}" -X POST "$EDGE_URL" \
  -H "Authorization: Bearer $JWT_ADMIN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"SenhaForte123!\",\"name\":\"Admin Test User\",\"role\":\"funcionario\",\"tab_access\":{\"clientes\":true,\"agenda\":true}}")
HTTP_CODE3=$(echo "$RESULT3" | grep -o "HTTPCODE:[0-9]*" | cut -d: -f2)
RESPONSE3=$(echo "$RESULT3" | sed 's/HTTPCODE:[0-9]*$//')

echo "Status: $HTTP_CODE3"
echo "Email criado: $TEST_EMAIL"
echo "Response: $RESPONSE3"
if [ "$HTTP_CODE3" = "200" ] || [ "$HTTP_CODE3" = "201" ]; then
    echo "✅ PASSOU: Usuário criado com sucesso"
    echo "📧 Email do usuário criado: $TEST_EMAIL"
else
    echo "❌ FALHOU: Esperado 200/201, obtido $HTTP_CODE3"
fi

# Resumo
echo -e "\n📊 RESUMO DOS TESTES"
echo "===================="
echo "Teste 1 (Sem JWT): $HTTP_CODE1 $([ "$HTTP_CODE1" = "401" ] && echo "✅" || echo "❌")"
echo "Teste 2 (JWT inválido): $HTTP_CODE2 $([ "$HTTP_CODE2" = "401" ] && echo "✅" || echo "❌")"
echo "Teste 3 (JWT admin): $HTTP_CODE3 $([ "$HTTP_CODE3" = "200" -o "$HTTP_CODE3" = "201" ] && echo "✅" || echo "❌")"

if [ "$HTTP_CODE1" = "401" ] && [ "$HTTP_CODE2" = "401" ] && ([ "$HTTP_CODE3" = "200" ] || [ "$HTTP_CODE3" = "201" ]); then
    echo -e "\n🎉 TODOS OS TESTES PASSARAM!"
    echo "Edge Function create-user está funcionando corretamente em produção."
else
    echo -e "\n⚠️ ALGUNS TESTES FALHARAM"
    echo "Revisar configuração da Edge Function."
fi
